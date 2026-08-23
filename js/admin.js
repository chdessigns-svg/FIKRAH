/* =========================================================
   FIKRAH SUMMIT
   admin.js — content manager logic for admin/index.html.
   Talks only to the CMS object defined in js/cms.js, which
   talks to Supabase. Sign-in uses real Supabase Auth, so only
   whoever has the admin account's email/password can save
   changes — everyone else can still read the public site.
   ========================================================= */

(function () {

  document.addEventListener("DOMContentLoaded", async () => {

    const gate = document.getElementById("adminGate");
    const shell = document.getElementById("adminShell");
    const gateForm = document.getElementById("adminGateForm");
    const gateError = document.getElementById("adminGateError");
    const logoutBtn = document.getElementById("adminLogout");

    const forgotLink = document.getElementById("forgotPasswordLink");
    const forgotForm = document.getElementById("forgotPasswordForm");
    const forgotCancelLink = document.getElementById("forgotCancelLink");
    const forgotError = document.getElementById("forgotError");
    const forgotSuccess = document.getElementById("forgotSuccess");

    const resetForm = document.getElementById("resetPasswordForm");
    const resetError = document.getElementById("resetError");

    if (!window.CMS || !CMS.isConfigured()) {
      gate.innerHTML = `
        <div class="admin-gate-card">
          <span class="logo-mark">F</span>
          <h1 class="section-title" style="font-size: 1.6rem;">Content Manager</h1>
          <p>
            Supabase isn't configured yet. Fill in
            <code>js/supabase-config.js</code> with your project's URL
            and anon key, then reload this page.
          </p>
        </div>
      `;
      return;
    }

    /* -----------------------------------------------------
       AUTO SIGN-OUT AFTER 10 MINUTES IDLE
       ----------------------------------------------------- */

    const IDLE_LIMIT_MS = 10 * 60 * 1000;
    let idleTimer = null;
    let isSignedIn = false;

    function clearIdleTimer() {
      clearTimeout(idleTimer);
      idleTimer = null;
    }

    function scheduleIdleLogout() {
      if (!isSignedIn) return;
      clearIdleTimer();
      idleTimer = setTimeout(async () => {
        await CMS.signOut();
        showGate();
        Fikrah.showToastIfPresent("Signed out after 10 minutes of inactivity.");
      }, IDLE_LIMIT_MS);
    }

    ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach(evt => {
      document.addEventListener(evt, scheduleIdleLogout, { passive: true });
    });

    // If a save/delete fails because the session has quietly expired
    // (a long-idle tab, a revoked token), sign out and prompt a fresh
    // login instead of leaving the admin stuck on a cryptic error.
    async function isSessionError(err) {
      if (!/jwt|token|session|auth/i.test(err.message || "")) return false;
      if (await CMS.getSession()) return false; // some other kind of error
      showGate();
      gateError.textContent = "Your session expired — please sign in again.";
      gateError.style.display = "block";
      return true;
    }

    async function unlock() {
      gate.style.display = "none";
      shell.style.display = "block";
      isSignedIn = true;
      scheduleIdleLogout();
      await renderAll();
    }

    function showSignInView() {
      gateForm.style.display = "block";
      forgotForm.style.display = "none";
      resetForm.style.display = "none";
    }

    function showForgotView() {
      gateForm.style.display = "none";
      forgotForm.style.display = "block";
      resetForm.style.display = "none";
      forgotError.style.display = "none";
      forgotSuccess.style.display = "none";
    }

    function showResetView() {
      gateForm.style.display = "none";
      forgotForm.style.display = "none";
      resetForm.style.display = "block";
    }

    function showGate() {
      isSignedIn = false;
      clearIdleTimer();
      shell.style.display = "none";
      gate.style.display = "grid";
      showSignInView();
    }

    // Supabase signs a visitor in automatically when they land here via
    // the "reset your password" email link, then fires this event — show
    // the "set a new password" form instead of unlocking the CMS.
    CMS.onAuthChange(event => {
      if (event === "PASSWORD_RECOVERY") {
        showResetView();
      }
    });

    const isRecoveryLink = window.location.hash.includes("type=recovery");
    const session = await CMS.getSession();

    if (isRecoveryLink) {
      showResetView();
    } else if (session) {
      await unlock();
    }

    gateForm.addEventListener("submit", async event => {
      event.preventDefault();
      const email = document.getElementById("adminEmail").value;
      const password = document.getElementById("adminPassword").value;
      const submitBtn = gateForm.querySelector("button[type=submit]");

      gateError.style.display = "none";
      submitBtn.disabled = true;

      try {
        await CMS.signIn(email, password);
        await unlock();
      } catch (err) {
        gateError.textContent = err.message || "Couldn't sign in — check the email and password and try again.";
        gateError.style.display = "block";
      } finally {
        submitBtn.disabled = false;
      }
    });

    if (forgotLink) {
      forgotLink.addEventListener("click", showForgotView);
    }

    if (forgotCancelLink) {
      forgotCancelLink.addEventListener("click", () => {
        forgotForm.reset();
        showSignInView();
      });
    }

    if (forgotForm) {
      forgotForm.addEventListener("submit", async event => {
        event.preventDefault();
        const email = document.getElementById("forgotEmail").value;
        const submitBtn = forgotForm.querySelector("button[type=submit]");

        forgotError.style.display = "none";
        forgotSuccess.style.display = "none";
        submitBtn.disabled = true;

        try {
          await CMS.resetPasswordForEmail(email);
          forgotSuccess.style.display = "block";
        } catch (err) {
          forgotError.textContent = err.message;
          forgotError.style.display = "block";
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    if (resetForm) {
      resetForm.addEventListener("submit", async event => {
        event.preventDefault();
        const newPassword = document.getElementById("newPassword").value;
        const newPasswordConfirm = document.getElementById("newPasswordConfirm").value;
        const submitBtn = resetForm.querySelector("button[type=submit]");

        resetError.style.display = "none";

        if (newPassword !== newPasswordConfirm) {
          resetError.textContent = "Those passwords don't match.";
          resetError.style.display = "block";
          return;
        }

        submitBtn.disabled = true;

        try {
          await CMS.updatePassword(newPassword);
          history.replaceState(null, "", window.location.pathname);
          resetForm.reset();
          await unlock();
        } catch (err) {
          resetError.textContent = err.message;
          resetError.style.display = "block";
        } finally {
          submitBtn.disabled = false;
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await CMS.signOut();
        gateForm.reset();
        showGate();
      });
    }

    /* -----------------------------------------------------
       TABS
       ----------------------------------------------------- */

    const tabs = document.querySelectorAll(".admin-tab");
    const panels = document.querySelectorAll(".admin-panel");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
      });
    });

    /* -----------------------------------------------------
       MODAL FORM (shared by posts / gallery / videos)
       ----------------------------------------------------- */

    const modal = document.getElementById("entryModal");
    const modalTitle = document.getElementById("entryModalTitle");
    const modalForm = document.getElementById("entryForm");
    const closeModalBtn = document.getElementById("closeEntryModal");

    let currentType = null; // 'post' | 'gallery' | 'video'
    let currentId = null;   // null when adding

    function fieldGroupsFor(type) {
      modalForm.querySelectorAll("[data-field-for]").forEach(group => {
        group.style.display = group.dataset.fieldFor.split(",").includes(type) ? "" : "none";
      });
    }

    const imageFileInput = document.getElementById("f-imageFile");
    const imagePreview = document.getElementById("f-imagePreview");
    const imageHiddenInput = document.getElementById("f-image");

    function setPreview(urlOrEmpty) {
      if (urlOrEmpty) {
        imagePreview.src = urlOrEmpty;
        imagePreview.style.display = "block";
      } else {
        imagePreview.removeAttribute("src");
        imagePreview.style.display = "none";
      }
    }

    if (imageFileInput) {
      imageFileInput.addEventListener("change", async () => {
        const file = imageFileInput.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
          alert("Please choose an image file.");
          imageFileInput.value = "";
          return;
        }

        if (file.size > 8 * 1024 * 1024) {
          alert("That photo is quite large (over 8MB). A smaller, compressed photo uploads faster.");
        }

        try {
          imageFileInput.disabled = true;
          const url = await CMS.uploadPhoto(file);
          imageHiddenInput.value = url;
          setPreview(url);
        } catch (err) {
          alert("Couldn't upload that photo: " + err.message);
          imageFileInput.value = "";
        } finally {
          imageFileInput.disabled = false;
        }
      });
    }

    function openModal(type, id, record) {
      currentType = type;
      currentId = id;

      fieldGroupsFor(type);
      modalForm.reset();
      setPreview("");

      const labels = { post: "Post", gallery: "Image", video: "Video" };
      modalTitle.textContent = (id ? "Edit " : "Add ") + labels[type];

      if (record) {
        Object.keys(record).forEach(key => {
          // The gallery/video/post forms each use their own field name
          // for a couple of fields to avoid colliding with each other,
          // since all three share one modal.
          let fieldName = key;
          if (type === "gallery" && key === "category") fieldName = "galleryCategory";
          if (type === "video" && key === "category") fieldName = "videoCategory";
          if (type === "video" && key === "youtubeId") fieldName = "videoUrl";
          if (type === "post" && key === "videoId") fieldName = "postVideoUrl";

          const field = modalForm.elements[fieldName];
          if (field) field.value = record[key] || "";
        });

        if (record.image) {
          setPreview(record.image);
        }
      }

      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      currentType = null;
      currentId = null;
    }

    closeModalBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

    modalForm.addEventListener("submit", async event => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(modalForm).entries());
      const submitBtn = modalForm.querySelector("button[type=submit]");
      submitBtn.disabled = true;

      try {
        if (currentType === "post") {
          if (data.postVideoUrl) {
            const videoId = CMS.extractYouTubeId(data.postVideoUrl);
            if (!videoId) {
              alert("That video link doesn't look right — check it and try again, or leave the video field blank.");
              return;
            }
            data.videoId = videoId;
          } else {
            data.videoId = "";
          }
          delete data.postVideoUrl;

          currentId ? await CMS.updatePost(currentId, data) : await CMS.addPost(data);
        }

        if (currentType === "gallery") {
          data.category = data.galleryCategory;
          delete data.galleryCategory;
          currentId ? await CMS.updateImage(currentId, data) : await CMS.addImage(data);
        }

        if (currentType === "video") {
          const youtubeId = CMS.extractYouTubeId(data.videoUrl);

          if (!youtubeId) {
            alert("That doesn't look like a valid YouTube link or video ID. Please check it and try again.");
            return;
          }

          const video = { title: data.title, category: data.videoCategory, youtubeId };
          currentId ? await CMS.updateVideo(currentId, video) : await CMS.addVideo(video);
        }

        const savedType = currentType;
        closeModal();
        if (savedType === "post") await renderPosts();
        if (savedType === "gallery") await renderGallery();
        if (savedType === "video") await renderVideos();
        Fikrah.showToastIfPresent("Saved.");
      } catch (err) {
        if (!(await isSessionError(err))) {
          alert("Couldn't save this: " + err.message);
        }
      } finally {
        submitBtn.disabled = false;
      }
    });

    /* -----------------------------------------------------
       ADD BUTTONS
       ----------------------------------------------------- */

    document.querySelectorAll("[data-add]").forEach(btn => {
      btn.addEventListener("click", () => openModal(btn.dataset.add, null, null));
    });

    /* -----------------------------------------------------
       RENDER TABLES
       ----------------------------------------------------- */

    let postsCache = [];
    let galleryCache = [];
    let videosCache = [];

    async function renderPosts() {
      const tbody = document.getElementById("postsTable");
      postsCache = await CMS.getPosts();

      tbody.innerHTML = postsCache.length ? postsCache.map(p => `
        <tr>
          <td>
            <div class="row-title">${Fikrah.escapeHTML(p.title || "")}</div>
            <div class="row-sub">${Fikrah.escapeHTML(p.excerpt || "").slice(0, 70)}${(p.excerpt || "").length > 70 ? "…" : ""}</div>
          </td>
          <td>${Fikrah.escapeHTML(p.category || "")}</td>
          <td>${CMS.formatDate(p.date)}</td>
          <td>
            <div class="admin-row-actions">
              <a class="admin-btn" href="/post?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">View</a>
              <button class="admin-btn" data-edit="post" data-id="${p.id}">Edit</button>
              <button class="admin-btn danger" data-delete="post" data-id="${p.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join("") : `<tr class="admin-empty-row"><td colspan="4">No posts yet.</td></tr>`;
    }

    async function renderGallery() {
      const tbody = document.getElementById("galleryTable");
      galleryCache = await CMS.getGallery();

      tbody.innerHTML = galleryCache.length ? galleryCache.map(g => `
        <tr>
          <td>
            <div class="row-title">${Fikrah.escapeHTML(g.caption || "")}</div>
            <div class="row-sub">${Fikrah.escapeHTML(g.small || "")}</div>
          </td>
          <td>${Fikrah.escapeHTML(g.category || "")}</td>
          <td>${g.image ? "Photo set" : "Placeholder"}</td>
          <td>
            <div class="admin-row-actions">
              <button class="admin-btn" data-edit="gallery" data-id="${g.id}">Edit</button>
              <button class="admin-btn danger" data-delete="gallery" data-id="${g.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join("") : `<tr class="admin-empty-row"><td colspan="4">No images yet.</td></tr>`;
    }

    async function renderVideos() {
      const tbody = document.getElementById("videosTable");
      videosCache = await CMS.getVideos();

      tbody.innerHTML = videosCache.length ? videosCache.map(v => `
        <tr>
          <td><div class="row-title">${Fikrah.escapeHTML(v.title || "")}</div></td>
          <td>${Fikrah.escapeHTML(v.category || "")}</td>
          <td><a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.youtubeId)}" target="_blank" rel="noopener">${Fikrah.escapeHTML(v.youtubeId || "")}</a></td>
          <td>
            <div class="admin-row-actions">
              <button class="admin-btn" data-edit="video" data-id="${v.id}">Edit</button>
              <button class="admin-btn danger" data-delete="video" data-id="${v.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join("") : `<tr class="admin-empty-row"><td colspan="4">No videos yet.</td></tr>`;
    }

    async function renderAll() {
      await Promise.all([renderPosts(), renderGallery(), renderVideos()]);
    }

    document.addEventListener("click", async event => {

      const editBtn = event.target.closest("[data-edit]");
      if (editBtn) {
        const type = editBtn.dataset.edit;
        const id = editBtn.dataset.id;
        const cache = { post: postsCache, gallery: galleryCache, video: videosCache }[type];
        const record = cache.find(item => item.id === id);
        openModal(type, id, record);
        return;
      }

      const deleteBtn = event.target.closest("[data-delete]");
      if (deleteBtn) {
        const type = deleteBtn.dataset.delete;
        const id = deleteBtn.dataset.id;

        if (!confirm("Delete this " + type + "? This can't be undone.")) {
          return;
        }

        try {
          if (type === "post") { await CMS.deletePost(id); await renderPosts(); }
          if (type === "gallery") { await CMS.deleteImage(id); await renderGallery(); }
          if (type === "video") { await CMS.deleteVideo(id); await renderVideos(); }
        } catch (err) {
          if (!(await isSessionError(err))) {
            alert("Couldn't delete this: " + err.message);
          }
        }
      }
    });

  });

})();
