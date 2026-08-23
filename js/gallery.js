/* =========================================================
   FIKRAH SUMMIT
   gallery.js — renders the gallery grid on pages/gallery.html
   and the homepage teaser, from CMS.getGallery().
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  if (!window.CMS) {
    return;
  }

  function itemHTML(item, variant) {
    const style = item.image ? ` style="background-image:url('${item.image}')"` : "";
    const bgClass = item.image ? "" : ` g-variant-${variant % CMS.GRADIENT_VARIANTS}`;

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

    const items = await CMS.getGallery();
    const filterBar = document.getElementById("galleryFilters");
    const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

    function render(list) {
      grid.innerHTML = list.length
        ? list.map((item, i) => itemHTML(item, i)).join("")
        : '<div class="member-empty" style="display:block;">No images yet — add some from the content manager.</div>';
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
    const items = (await CMS.getGallery()).slice(0, 5);
    teaser.innerHTML = items.map((item, i) => itemHTML(item, i)).join("");
  }

});
