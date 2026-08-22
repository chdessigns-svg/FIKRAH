/* =========================================================
   FIKRAH SUMMIT
   videos.js — renders YouTube video grids on pages/videos.html
   and the homepage teaser, from CMS.getVideos().

   Videos render as a thumbnail with a play button (no iframe
   loaded yet). The real YouTube embed is only inserted once
   someone clicks play, so the page stays fast and only talks
   to YouTube when a visitor actually chooses to watch.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  if (!window.CMS) {
    return;
  }

  function cardHTML(video) {
    const id = video.youtubeId || CMS.extractYouTubeId(video.url || "");
    if (!id) return "";

    return `
      <article class="video-card reveal" data-youtube-id="${id}">
        <div class="video-thumb" style="background-image:url('${CMS.youtubeThumb(id)}')">
          <button class="video-play" type="button" aria-label="Play video">▶</button>
        </div>
        <div class="video-card-body">
          <strong>${Fikrah.escapeHTML(video.title || "Untitled video")}</strong>
          ${video.category ? `<span class="video-tag">${Fikrah.escapeHTML(video.category)}</span>` : ""}
        </div>
      </article>
    `;
  }

  function play(card) {
    const id = card.dataset.youtubeId;
    const thumb = card.querySelector(".video-thumb");
    thumb.innerHTML = `<iframe src="${CMS.youtubeEmbedUrl(id)}" title="YouTube video player" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    card.classList.add("is-playing");
  }

  document.addEventListener("click", event => {
    const btn = event.target.closest(".video-play");
    if (!btn) return;
    play(btn.closest(".video-card"));
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
        ? list.map(cardHTML).join("")
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
      ? items.map(cardHTML).join("")
      : '<div class="member-empty" style="display:block;">No videos yet.</div>';
  }

});
