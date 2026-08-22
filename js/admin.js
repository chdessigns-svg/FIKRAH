/* =========================================================
   FIKRAH SUMMIT
   admin.js — content manager logic for admin/index.html.
   Talks only to the CMS object defined in js/cms.js.

   SECURITY NOTE: the password gate below is a convenience
   screen, not real authentication — the "password" lives in
   this file, in plain text, on the client. It stops casual
   visitors from poking at the panel; it does not stop anyone
   who reads the page source. Do not use this to protect
   anything sensitive. For a real multi-user CMS with proper
   login, this admin panel would need to be replaced with a
   server-backed one.
   ========================================================= */

(function () {

  const ADMIN_PASSWORD = "fikrah2026";
  const SESSION_KEY = "fikrah_admin_session";

  document.addEventListener("DOMContentLoaded", () => {

    const gate = document.getElementById("adminGate");
    const shell = document.getElementById("adminShell");
    const gateForm = document.getElementById("adminGateForm");
    const gateError = document.getElementById("adminGateError");
    const logoutBtn = document.getElementById("adminLogout");

    function unlock() {
      gate.style.display = "none";
      shell.style.display = "block";
      renderAll();
    }

    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      unlock();
    }

    gateForm.addEventListener("submit", event => {
      event.preventDefault();
      const input = document.getElementById("adminPassword").value;

      if (input === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, "true");
        gateError.style.display = "none";
        unlock();
      } else {
        gateError.style.display = "block";
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem(SESSION_KEY);
        shell.style.display = "none";
        gate.style.display = "grid";
        gateForm.reset();
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
       MODAL FORM (shared by slides / posts / gallery)
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

    function setPreview(dataUrlOrEmpty) {
      if (dataUrlOrEmpty) {
        imagePreview.src = dataUrlOrEmpty;
        imagePreview.style.display = "block";
      } else {
        imagePreview.removeAttribute("src");
        imagePreview.style.display = "none";
      }
    }

    if (imageFileInput) {
      imageFileInput.addEventListener("change", () => {
        const file = imageFileInput.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
          alert("Please choose an image file.");
          imageFileInput.value = "";
          return;
        }

        if (file.size > 3 * 1024 * 1024) {
          alert("That photo is quite large (over 3MB) and may not fit in this browser's storage. A smaller, compressed photo works best.");
        }

        const reader = new FileReader();

        reader.onload = () => {
          imageHiddenInput.value = reader.result;
          setPreview(reader.result);
        };

        reader.readAsDataURL(file);
      });
    }

    function openModal(type, id) {
      currentType = type;
      currentId = id;

      fieldGroupsFor(type);
      modalForm.reset();
      setPreview("");

      const labels = { post: "Post", gallery: "Image", video: "Video" };
      modalTitle.textContent = (id ? "Edit " : "Add ") + labels[type];

      if (id) {
        let record = null;

        if (type === "post") record = CMS.getPosts().find(p => p.id === id);
        if (type === "gallery") record = CMS.getGallery().find(g => g.id === id);
        if (type === "video") record = CMS.getVideos().find(v => v.id === id);

        if (record) {
          Object.keys(record).forEach(key => {
            // The gallery/video forms each reuse their own "category"
            // field name to avoid colliding with the post form's
            // "category" field, since all three share one modal.
            let fieldName = key;
            if (type === "gallery" && key === "category") fieldName = "galleryCategory";
            if (type === "video" && key === "category") fieldName = "videoCategory";
            if (type === "video" && key === "youtubeId") fieldName = "videoUrl";
            if (type === "post" && key === "videoId") fieldName = "postVideoUrl";

            const field = modalForm.elements[fieldName];
            if (field) field.value = record[key];
          });

          if (record.image) {
            setPreview(record.image);
          }
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

    modalForm.addEventListener("submit", event => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(modalForm).entries());
      let saved = false;

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

        saved = currentId ? CMS.updatePost(currentId, data) : CMS.addPost(data);
      }

      if (currentType === "gallery") {
        data.category = data.galleryCategory;
        delete data.galleryCategory;
        saved = currentId ? CMS.updateImage(currentId, data) : CMS.addImage(data);
      }

      if (currentType === "video") {
        const youtubeId = CMS.extractYouTubeId(data.videoUrl);

        if (!youtubeId) {
          alert("That doesn't look like a valid YouTube link or video ID. Please check it and try again.");
          return;
        }

        const video = { title: data.title, category: data.videoCategory, youtubeId };
        saved = currentId ? CMS.updateVideo(currentId, video) : CMS.addVideo(video);
      }

      if (!saved) {
        alert("Couldn't save this — this browser's storage is full (likely from earlier photo uploads). Try removing an old photo, or compress it before uploading, then try again.");
        return;
      }

      closeModal();
      renderAll();
      Fikrah.showToastIfPresent("Saved.");
    });

    /* -----------------------------------------------------
       ADD BUTTONS
       ----------------------------------------------------- */

    document.querySelectorAll("[data-add]").forEach(btn => {
      btn.addEventListener("click", () => openModal(btn.dataset.add, null));
    });

    /* -----------------------------------------------------
       RENDER TABLES
       ----------------------------------------------------- */

    function renderPosts() {
      const tbody = document.getElementById("postsTable");
      const posts = CMS.getPosts();

      tbody.innerHTML = posts.length ? posts.map(p => `
        <tr>
          <td>
            <div class="row-title">${Fikrah.escapeHTML(p.title || "")}</div>
            <div class="row-sub">${Fikrah.escapeHTML(p.excerpt || "").slice(0, 70)}${(p.excerpt || "").length > 70 ? "…" : ""}</div>
          </td>
          <td>${Fikrah.escapeHTML(p.category || "")}</td>
          <td>${CMS.formatDate(p.date)}</td>
          <td>
            <div class="admin-row-actions">
              <a class="admin-btn" href="../pages/post.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">View</a>
              <button class="admin-btn" data-edit="post" data-id="${p.id}">Edit</button>
              <button class="admin-btn danger" data-delete="post" data-id="${p.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join("") : `<tr class="admin-empty-row"><td colspan="4">No posts yet.</td></tr>`;
    }

    function renderGallery() {
      const tbody = document.getElementById("galleryTable");
      const items = CMS.getGallery();

      tbody.innerHTML = items.length ? items.map(g => `
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

    function renderVideos() {
      const tbody = document.getElementById("videosTable");
      const items = CMS.getVideos();

      tbody.innerHTML = items.length ? items.map(v => `
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

    function renderAll() {
      renderPosts();
      renderGallery();
      renderVideos();
    }

    document.addEventListener("click", event => {

      const editBtn = event.target.closest("[data-edit]");
      if (editBtn) {
        openModal(editBtn.dataset.edit, editBtn.dataset.id);
        return;
      }

      const deleteBtn = event.target.closest("[data-delete]");
      if (deleteBtn) {
        const type = deleteBtn.dataset.delete;
        const id = deleteBtn.dataset.id;

        if (!confirm("Delete this " + type + "? This can't be undone.")) {
          return;
        }

        if (type === "post") CMS.deletePost(id);
        if (type === "gallery") CMS.deleteImage(id);
        if (type === "video") CMS.deleteVideo(id);

        renderAll();
      }
    });

    /* -----------------------------------------------------
       EXPORT / IMPORT / RESET
       ----------------------------------------------------- */

    const exportBtn = document.getElementById("exportBtn");
    const importBtn = document.getElementById("importBtn");
    const importInput = document.getElementById("importInput");
    const resetBtn = document.getElementById("resetBtn");

    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const blob = new Blob([CMS.exportAll()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "fikrah-content-export.json";
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (importBtn && importInput) {
      importBtn.addEventListener("click", () => importInput.click());

      importInput.addEventListener("change", () => {
        const file = importInput.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
          try {
            CMS.importAll(reader.result);
            renderAll();
            Fikrah.showToastIfPresent("Content imported.");
          } catch (err) {
            alert("That file doesn't look like a valid Fikrah content export.");
          }
        };

        reader.readAsText(file);
        importInput.value = "";
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("Reset all content in this browser back to the site defaults? This can't be undone.")) {
          CMS.resetAll();
          renderAll();
        }
      });
    }

  });

})();
