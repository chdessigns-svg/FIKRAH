/* =========================================================
   FIKRAH SUMMIT — CMS (Supabase-backed)
   js/cms.js

   A thin wrapper around the Supabase JS client. Manages three
   tables — posts, gallery, videos — used by the homepage
   slider (built from the latest posts), the blog pages, the
   gallery page and the Videos page. Edited from admin/index.html.

   Content lives in a real Postgres database (see
   supabase/schema.sql), so anything added in the admin panel
   is immediately visible to every visitor, on any device —
   unlike the old browser-only localStorage version.

   Requires js/supabase-config.js (SUPABASE_URL /
   SUPABASE_ANON_KEY) and the Supabase JS CDN script to be
   loaded before this file.
   ========================================================= */

(function (global) {

  const GRADIENT_VARIANTS = 5;

  let supabaseClient = null;

  if (global.SUPABASE_URL && global.SUPABASE_ANON_KEY && global.supabase) {
    supabaseClient = global.supabase.createClient(global.SUPABASE_URL, global.SUPABASE_ANON_KEY);
  } else {
    console.warn("Supabase isn't configured yet — fill in js/supabase-config.js. Content will show as empty until then.");
  }

  function requireClient() {
    if (!supabaseClient) {
      throw new Error("Supabase isn't configured yet — see js/supabase-config.js.");
    }
    return supabaseClient;
  }

  function ok(result) {
    if (result.error) throw new Error(result.error.message);
    return result;
  }

  /* -------------------------------------------------------
     ROW <-> APP OBJECT MAPPING
     (the DB uses snake_case for the couple of fields that
     differ from the camelCase names used across the site)
     ------------------------------------------------------- */

  function postFromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      category: row.category,
      date: row.date,
      author: row.author,
      image: row.image,
      videoId: row.video_id,
    };
  }

  function postToRow(post) {
    return {
      title: post.title || "",
      excerpt: post.excerpt || "",
      body: post.body || "",
      category: post.category || "",
      date: post.date || null,
      author: post.author || "",
      image: post.image || "",
      video_id: post.videoId || null,
    };
  }

  function videoFromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      youtubeId: row.youtube_id,
    };
  }

  function videoToRow(video) {
    return {
      title: video.title || "",
      category: video.category || "",
      youtube_id: video.youtubeId,
    };
  }

  /* -------------------------------------------------------
     PUBLIC API
     ------------------------------------------------------- */

  const CMS = {

    GRADIENT_VARIANTS,
    isConfigured() {
      return !!supabaseClient;
    },

    /* ---- AUTH (admin login) ---- */

    async signIn(email, password) {
      const client = requireClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    async signOut() {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
    },
    async getSession() {
      if (!supabaseClient) return null;
      const { data } = await supabaseClient.auth.getSession();
      return data.session;
    },
    onAuthChange(callback) {
      if (!supabaseClient) return;
      supabaseClient.auth.onAuthStateChange((event, session) => callback(event, session));
    },
    async resetPasswordForEmail(email) {
      const client = requireClient();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: global.location.origin + global.location.pathname,
      });
      if (error) throw new Error(error.message);
    },
    async updatePassword(newPassword) {
      const client = requireClient();
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },

    /* ---- PHOTO UPLOAD (Supabase Storage, bucket "media") ---- */

    async uploadPhoto(file) {
      const client = requireClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const uploadResult = await client.storage.from("media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadResult.error) throw new Error(uploadResult.error.message);

      const { data } = client.storage.from("media").getPublicUrl(path);
      return data.publicUrl;
    },

    /* ---- POSTS ---- */

    async getPosts() {
      if (!supabaseClient) return [];
      const result = ok(await supabaseClient
        .from("posts")
        .select("*")
        .order("date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }));
      return result.data.map(postFromRow);
    },
    async getPost(id) {
      if (!supabaseClient) return null;
      const result = ok(await supabaseClient.from("posts").select("*").eq("id", id).maybeSingle());
      return postFromRow(result.data);
    },
    async getFeaturedPosts(limit) {
      const posts = await this.getPosts();
      return posts.slice(0, limit || 5);
    },
    async addPost(post) {
      const client = requireClient();
      ok(await client.from("posts").insert(postToRow(post)));
    },
    async updatePost(id, patch) {
      const client = requireClient();
      const current = await this.getPost(id);
      ok(await client.from("posts").update(postToRow(Object.assign({}, current, patch))).eq("id", id));
    },
    async deletePost(id) {
      const client = requireClient();
      ok(await client.from("posts").delete().eq("id", id));
    },

    /* ---- GALLERY ---- */

    async getGallery() {
      if (!supabaseClient) return [];
      const result = ok(await supabaseClient.from("gallery").select("*").order("created_at", { ascending: false }));
      return result.data;
    },
    async addImage(item) {
      const client = requireClient();
      ok(await client.from("gallery").insert({
        caption: item.caption || "",
        small: item.small || "",
        category: item.category || "",
        image: item.image || "",
      }));
    },
    async updateImage(id, patch) {
      const client = requireClient();
      const row = {};
      if ("caption" in patch) row.caption = patch.caption;
      if ("small" in patch) row.small = patch.small;
      if ("category" in patch) row.category = patch.category;
      if ("image" in patch) row.image = patch.image;
      ok(await client.from("gallery").update(row).eq("id", id));
    },
    async deleteImage(id) {
      const client = requireClient();
      ok(await client.from("gallery").delete().eq("id", id));
    },

    /* ---- VIDEOS ---- */

    async getVideos() {
      if (!supabaseClient) return [];
      const result = ok(await supabaseClient.from("videos").select("*").order("created_at", { ascending: false }));
      return result.data.map(videoFromRow);
    },
    async addVideo(video) {
      const client = requireClient();
      ok(await client.from("videos").insert(videoToRow(video)));
    },
    async updateVideo(id, patch) {
      const client = requireClient();
      const row = {};
      if ("title" in patch) row.title = patch.title;
      if ("category" in patch) row.category = patch.category;
      if ("youtubeId" in patch) row.youtube_id = patch.youtubeId;
      ok(await client.from("videos").update(row).eq("id", id));
    },
    async deleteVideo(id) {
      const client = requireClient();
      ok(await client.from("videos").delete().eq("id", id));
    },

    /* ---- YOUTUBE HELPERS ---- */

    // Accepts a full YouTube URL (watch, youtu.be, shorts or embed) or a
    // bare 11-character video ID, and returns just the ID (or "" if the
    // input doesn't look like a YouTube video at all).
    extractYouTubeId(input) {
      const value = (input || "").trim();
      if (/^[\w-]{11}$/.test(value)) return value;

      try {
        const url = new URL(value);
        if (url.hostname === "youtu.be") {
          return url.pathname.slice(1, 12);
        }
        if (url.hostname.includes("youtube.com")) {
          if (url.searchParams.get("v")) return url.searchParams.get("v").slice(0, 11);
          const match = url.pathname.match(/\/(embed|shorts)\/([\w-]{11})/);
          if (match) return match[2];
        }
      } catch (err) {
        // Not a valid URL — fall through to "".
      }

      return "";
    },
    youtubeThumb(id) {
      return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    },
    youtubeEmbedUrl(id) {
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    },

    // A bare click-to-play thumbnail for a YouTube video — usable on its
    // own (e.g. inline in a blog post) or wrapped in a bigger card.
    youtubeFacadeHTML(id) {
      return `
        <div class="video-thumb" data-youtube-id="${id}" style="background-image:url('${this.youtubeThumb(id)}')">
          <button class="video-play" type="button" aria-label="Play video">▶</button>
        </div>
      `;
    },
    // The full card used on the Videos page/teaser: facade + title/tag.
    videoCardHTML(video) {
      const id = video.youtubeId || this.extractYouTubeId(video.url || "");
      if (!id) return "";

      return `
        <article class="video-card reveal">
          ${this.youtubeFacadeHTML(id)}
          <div class="video-card-body">
            <strong>${global.Fikrah.escapeHTML(video.title || "Untitled video")}</strong>
            ${video.category ? `<span class="video-tag">${global.Fikrah.escapeHTML(video.category)}</span>` : ""}
          </div>
        </article>
      `;
    },

    formatDate(iso) {
      if (!iso) return "";
      const d = new Date(iso + "T00:00:00");
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    },

    /* -----------------------------------------------------
       SHARED RENDER HELPERS
       (used by public pages so the visual language always
       matches the site's gradient-block design system)
       ----------------------------------------------------- */

    coverBlock(title, image, variant, initial) {
      const letter = (initial || title || "F").trim().charAt(0).toUpperCase();
      if (image) {
        return `<div class="cms-cover" style="background-image:url('${image}')"></div>`;
      }
      return `<div class="cms-cover g-variant-${variant % GRADIENT_VARIANTS}"><span class="cms-cover-letter">${letter}</span></div>`;
    },
  };

  global.CMS = CMS;

  /* -------------------------------------------------------
     SMALL SHARED HELPERS
     Used by blog.js, post.js, gallery.js, slider.js and
     admin.js so they don't each reimplement escaping/toasts.
     ------------------------------------------------------- */

  global.Fikrah = global.Fikrah || {};

  global.Fikrah.escapeHTML = function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  };

  global.Fikrah.showToastIfPresent = function showToastIfPresent(message) {
    if (typeof global.showToast === "function") {
      global.showToast(message);
    }
  };

  /* -------------------------------------------------------
     YOUTUBE CLICK-TO-PLAY
     Delegated globally so any page that renders a
     .video-thumb (Videos page, homepage teaser, inline in a
     blog post) gets play-on-click for free.
     ------------------------------------------------------- */

  document.addEventListener("click", event => {
    const btn = event.target.closest(".video-play");
    if (!btn) return;

    const thumb = btn.closest(".video-thumb");
    if (!thumb) return;

    const id = thumb.dataset.youtubeId;

    thumb.innerHTML = `<iframe src="${CMS.youtubeEmbedUrl(id)}" title="YouTube video player" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    thumb.classList.add("is-playing");
  });

})(window);
