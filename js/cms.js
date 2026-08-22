/* =========================================================
   FIKRAH SUMMIT — LIGHTWEIGHT CMS
   js/cms.js

   A client-side content layer backed by localStorage.
   Manages two collections — posts and gallery — used by the
   homepage slider (built from the latest posts), the blog
   pages and the gallery page. Edited from admin/index.html.

   NOTE: localStorage is per-browser, not a server database.
   Content added in the admin panel is only visible on the
   same browser/device unless exported and imported elsewhere.
   Use the Export/Import buttons in the admin panel to move
   content between machines, or wire this layer up to a real
   backend (WordPress REST API, headless CMS, custom API)
   when the site is ready for one.
   ========================================================= */

(function (global) {

  const KEYS = {
    posts: "fikrah_cms_posts",
    gallery: "fikrah_cms_gallery",
    videos: "fikrah_cms_videos",
  };

  const GRADIENT_VARIANTS = 5;

  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (err) {
      console.warn("CMS read failed for", key, err);
      return fallback;
    }
  }

  function write(key, list) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    } catch (err) {
      console.warn("CMS write failed for", key, err);
      return false;
    }
  }

  /* -------------------------------------------------------
     DEFAULT / SEED CONTENT
     ------------------------------------------------------- */

  const DEFAULT_POSTS = [
    {
      id: "post_1",
      title: "Recap: The 104th Session at Adil Conference Center",
      excerpt:
        "Chaired by Eng. Nassor Morsady Hassan, Session 104 explored how disciplined presentation turns good ideas into decisions people act on.",
      body:
        "Fikrah Summit's 104th session opened with a review of the community's growth since its early days as DOUBLE G, before moving into the evening's core theme: the power of presentation as a leadership skill.\n\nMembers practiced structuring an argument, reading a room and closing with a clear call to action. As with every Fikrah session, the evening balanced formal learning with open networking, giving entrepreneurs, students and executives space to exchange contacts and ideas outside the structured programme.\n\nThe session closed with a short Q&A and an invitation for members to propose topics for upcoming sessions.",
      category: "Session Recap",
      date: "2026-07-11",
      author: "Fikrah Summit",
      image: "",
    },
    {
      id: "post_2",
      title: "Why We Renamed DOUBLE G to Fikrah Summit",
      excerpt:
        "A short look at the philosophy behind the community's evolution — and what stays the same.",
      body:
        "Originally founded as DOUBLE G (Givers Gain), our community evolved into Fikrah Summit with a renewed philosophy and a stronger focus on leadership, entrepreneurship, business excellence and lifelong learning.\n\nThe name change reflected something deeper than branding: a shift toward structured, weekly learning built around real speakers, real case studies and real accountability between members.\n\nWhat hasn't changed is the belief that gathering ambitious people in one room, consistently, compounds into something bigger than any single session.",
      category: "Community",
      date: "2026-05-02",
      author: "Fikrah Summit",
      image: "",
    },
    {
      id: "post_3",
      title: "Five Takeaways from Prof. Mussa J. Assad on Academic Leadership",
      excerpt:
        "Notes from Session 61, where the Vice Chancellor of Muslim University of Morogoro joined Fikrah for a conversation on leading institutions.",
      body:
        "When Prof. Mussa J. Assad, Vice Chancellor of Muslim University of Morogoro, joined Fikrah Summit for Session 61, the room filled quickly.\n\nHis talk moved between academic governance and everyday leadership — the discipline of listening before deciding, the cost of avoiding hard conversations, and why institutions (like communities) grow only as fast as the trust inside them.\n\nMembers left with a simple challenge: apply one habit from academic leadership to their own business or team this month.",
      category: "Session Recap",
      date: "2026-02-14",
      author: "Fikrah Summit",
      image: "",
    },
  ];

  const DEFAULT_GALLERY = [
    { id: "g1", caption: "People. Ideas. Connections.", small: "Fikrah Summit", category: "Community", image: "" },
    { id: "g2", caption: "Learning together", small: "Session", category: "Sessions", image: "" },
    { id: "g3", caption: "Networking", small: "Community", category: "Community", image: "" },
    { id: "g4", caption: "Sharing experience", small: "Speaker", category: "Speakers", image: "" },
    { id: "g5", caption: "Creating impact", small: "Highlights", category: "Sessions", image: "" },
    { id: "g6", caption: "Adil Conference Center", small: "Session 104", category: "Sessions", image: "" },
    { id: "g7", caption: "Opening remarks", small: "Chairman's Address", category: "Speakers", image: "" },
    { id: "g8", caption: "Open floor discussion", small: "Q&amp;A", category: "Community", image: "" },
    { id: "g9", caption: "Group photo", small: "Closing", category: "Community", image: "" },
  ];

  const DEFAULT_VIDEOS = [
    {
      id: "v1",
      title: "Fikrah Summit — Session Highlights",
      youtubeId: "58vNS3C0Jds",
      category: "Sessions",
    },
  ];

  function seedIfEmpty() {
    if (!localStorage.getItem(KEYS.posts)) write(KEYS.posts, DEFAULT_POSTS);
    if (!localStorage.getItem(KEYS.gallery)) write(KEYS.gallery, DEFAULT_GALLERY);
    if (!localStorage.getItem(KEYS.videos)) write(KEYS.videos, DEFAULT_VIDEOS);
  }

  seedIfEmpty();

  /* -------------------------------------------------------
     PUBLIC API
     ------------------------------------------------------- */

  const CMS = {

    KEYS,
    GRADIENT_VARIANTS,

    getPosts() {
      return read(KEYS.posts, DEFAULT_POSTS).sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
      );
    },
    savePosts(list) {
      return write(KEYS.posts, list);
    },
    getPost(id) {
      return this.getPosts().find(p => p.id === id) || null;
    },
    getFeaturedPosts(limit) {
      // Used by the homepage slider — the slider is simply the
      // latest posts, so there is nothing separate to manage.
      return this.getPosts().slice(0, limit || 5);
    },
    addPost(post) {
      const list = read(KEYS.posts, DEFAULT_POSTS);
      list.unshift(Object.assign({ id: uid("post") }, post));
      return write(KEYS.posts, list);
    },
    updatePost(id, patch) {
      const list = read(KEYS.posts, DEFAULT_POSTS);
      const idx = list.findIndex(p => p.id === id);
      if (idx > -1) {
        list[idx] = Object.assign({}, list[idx], patch);
        return write(KEYS.posts, list);
      }
      return false;
    },
    deletePost(id) {
      const list = read(KEYS.posts, DEFAULT_POSTS).filter(p => p.id !== id);
      return write(KEYS.posts, list);
    },

    getGallery() {
      return read(KEYS.gallery, DEFAULT_GALLERY);
    },
    saveGallery(list) {
      return write(KEYS.gallery, list);
    },
    addImage(item) {
      const list = read(KEYS.gallery, DEFAULT_GALLERY);
      list.unshift(Object.assign({ id: uid("img") }, item));
      return write(KEYS.gallery, list);
    },
    updateImage(id, patch) {
      const list = read(KEYS.gallery, DEFAULT_GALLERY);
      const idx = list.findIndex(g => g.id === id);
      if (idx > -1) {
        list[idx] = Object.assign({}, list[idx], patch);
        return write(KEYS.gallery, list);
      }
      return false;
    },
    deleteImage(id) {
      const list = read(KEYS.gallery, DEFAULT_GALLERY).filter(g => g.id !== id);
      return write(KEYS.gallery, list);
    },

    getVideos() {
      return read(KEYS.videos, DEFAULT_VIDEOS);
    },
    saveVideos(list) {
      return write(KEYS.videos, list);
    },
    addVideo(video) {
      const list = read(KEYS.videos, DEFAULT_VIDEOS);
      list.unshift(Object.assign({ id: uid("vid") }, video));
      return write(KEYS.videos, list);
    },
    updateVideo(id, patch) {
      const list = read(KEYS.videos, DEFAULT_VIDEOS);
      const idx = list.findIndex(v => v.id === id);
      if (idx > -1) {
        list[idx] = Object.assign({}, list[idx], patch);
        return write(KEYS.videos, list);
      }
      return false;
    },
    deleteVideo(id) {
      const list = read(KEYS.videos, DEFAULT_VIDEOS).filter(v => v.id !== id);
      return write(KEYS.videos, list);
    },

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

    resetAll() {
      write(KEYS.posts, DEFAULT_POSTS);
      write(KEYS.gallery, DEFAULT_GALLERY);
      write(KEYS.videos, DEFAULT_VIDEOS);
    },

    exportAll() {
      return JSON.stringify(
        {
          posts: read(KEYS.posts, DEFAULT_POSTS),
          gallery: read(KEYS.gallery, DEFAULT_GALLERY),
          videos: read(KEYS.videos, DEFAULT_VIDEOS),
        },
        null,
        2
      );
    },
    importAll(json) {
      const data = JSON.parse(json);
      if (Array.isArray(data.posts)) write(KEYS.posts, data.posts);
      if (Array.isArray(data.gallery)) write(KEYS.gallery, data.gallery);
      if (Array.isArray(data.videos)) write(KEYS.videos, data.videos);
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

})(window);
