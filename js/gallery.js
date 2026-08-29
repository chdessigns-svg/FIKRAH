/* =========================================================
   FIKRAH SUMMIT
   gallery.js — renders the gallery grid on pages/gallery.html
   and the homepage teaser, from the local GALLERY_ITEMS list
   below (not the CMS/Supabase gallery table).

   To change the photos shown on the site, edit GALLERY_ITEMS:
   add/remove/reorder entries, or point "image" at a different
   file in assets/images/gallery/.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const GALLERY_ITEMS = [
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.26.jpeg", small: "Fikrah Summit", caption: "People. Ideas. Connections.", category: "Community" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.27.jpeg", small: "Session", caption: "Learning together", category: "Sessions" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.29 (1).jpeg", small: "Community", caption: "Networking", category: "Community" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.29 (2).jpeg", small: "Speaker", caption: "Sharing experience", category: "Speakers" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.29.jpeg", small: "Highlights", caption: "Creating impact", category: "Sessions" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.30 (1).jpeg", small: "Session 104", caption: "Adil Conference Center", category: "Sessions" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.30 (2).jpeg", small: "Chairman's Address", caption: "Opening remarks", category: "Speakers" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.30.jpeg", small: "Q&A", caption: "Open floor discussion", category: "Community" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.31.jpeg", small: "Closing", caption: "Group photo", category: "Community" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.32 (1).jpeg", small: "Session", caption: "A packed room, ready to learn", category: "Sessions" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.32.jpeg", small: "Networking", caption: "Conversations after the session", category: "Community" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.35.jpeg", small: "Speaker", caption: "On the floor", category: "Speakers" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.36 (1).jpeg", small: "Highlights", caption: "Session moment", category: "Sessions" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.36 (2).jpeg", small: "Fikrah Summit", caption: "Faces of the community", category: "Community" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.36.jpeg", small: "Address", caption: "Sharing insight", category: "Speakers" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.37 (1).jpeg", small: "Session", caption: "Engaged and listening", category: "Sessions" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.37 (2).jpeg", small: "Community", caption: "Building connections", category: "Community" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.37.jpeg", small: "Panel", caption: "In discussion", category: "Speakers" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.38 (1).jpeg", small: "Highlights", caption: "Another session, another lesson", category: "Sessions" },
    { image: "/assets/images/gallery/WhatsApp Image 2026-08-29 at 14.59.38.jpeg", small: "Closing", caption: "Until next time", category: "Community" },
  ];

  const GRADIENT_VARIANTS = 5;

  function itemHTML(item, variant) {
    const style = item.image ? ` style="background-image:url('${encodeURI(item.image)}')"` : "";
    const bgClass = item.image ? "" : ` g-variant-${variant % GRADIENT_VARIANTS}`;

    return `
      <article class="gallery-item reveal${bgClass}"${style}>
        <div class="gallery-content">
          <small>${Fikrah.escapeHTML(item.small || "")}</small>
          <strong>${Fikrah.escapeHTML(item.caption || "")}</strong>
        </div>
      </article>
    `;
  }

  /* -------------------------------------------------------
     FULL GALLERY (pages/gallery.html)
     ------------------------------------------------------- */

  const grid = document.getElementById("galleryGrid");

  if (grid) {

    const items = GALLERY_ITEMS;
    const filterBar = document.getElementById("galleryFilters");
    const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

    function render(list) {
      grid.innerHTML = list.length
        ? list.map((item, i) => itemHTML(item, i)).join("")
        : '<div class="member-empty" style="display:block;">No images yet.</div>';
      Fikrah.observeReveals(grid);
    }

    if (filterBar) {
      filterBar.innerHTML = `
        <button class="gallery-filter active" data-category="all">All</button>
        ${categories.map(cat => `<button class="gallery-filter" data-category="${Fikrah.escapeHTML(cat)}">${Fikrah.escapeHTML(cat)}</button>`).join("")}
      `;

      filterBar.addEventListener("click", event => {
        const btn = event.target.closest(".gallery-filter");
        if (!btn) return;

        filterBar.querySelectorAll(".gallery-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const category = btn.dataset.category;
        render(category === "all" ? items : items.filter(i => i.category === category));
      });
    }

    render(items);
  }

  /* -------------------------------------------------------
     HOMEPAGE TEASER (index.html)
     ------------------------------------------------------- */

  const teaser = document.getElementById("galleryTeaser");

  if (teaser) {
    const items = GALLERY_ITEMS.slice(0, 5);
    teaser.innerHTML = items.map((item, i) => itemHTML(item, i)).join("");
    Fikrah.observeReveals(teaser);
  }

});
