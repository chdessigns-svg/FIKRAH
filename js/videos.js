/* =========================================================
   FIKRAH SUMMIT
   videos.js — renders YouTube video grids on pages/videos.html
   and the homepage teaser, from CMS.getVideos().

   Videos render as a thumbnail with a play button (no iframe
   loaded yet). The real YouTube embed is only inserted once
   someone clicks play (see the click-to-play handler in
   cms.js), so the page stays fast and only talks to YouTube
   when a visitor actually chooses to watch.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  if (!window.CMS) {
    return;
  }

  // If videos are added/edited in the admin panel in another tab on this
  // same browser, refresh this page so the change shows up without
  // needing a manual reload.
  window.addEventListener("storage", event => {
    if (event.key === CMS.KEYS.videos) {
      location.reload();
    }
  });

  /* -------------------------------------------------------
     FULL VIDEOS PAGE (pages/videos.html)
     ------------------------------------------------------- */

  const grid = document.getElementById("videoGrid");

  if (grid) {

    const items = CMS.getVideos();
    const filterBar = document.getElementById("videoFilters");
    const categories = Array.from(new Set(items.map(v => v.category).filter(Boolean)));

    function render(list) {
      grid.innerHTML = list.length
        ? list.map(v => CMS.videoCardHTML(v)).join("")
        : '<div class="member-empty" style="display:block;">No videos yet — add some from the content manager.</div>';
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
        render(category === "all" ? items : items.filter(v => v.category === category));
      });
    }

    render(items);
  }

  /* -------------------------------------------------------
     HOMEPAGE TEASER (index.html)
     ------------------------------------------------------- */

  const teaser = document.getElementById("videoTeaser");

  if (teaser) {
    const items = CMS.getVideos().slice(0, 3);
    teaser.innerHTML = items.length
      ? items.map(v => CMS.videoCardHTML(v)).join("")
      : '<div class="member-empty" style="display:block;">No videos yet.</div>';
  }

});
