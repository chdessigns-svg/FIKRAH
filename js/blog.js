/* =========================================================
   FIKRAH SUMMIT
   blog.js — renders the post grid on pages/blog.html and the
   "latest posts" teaser on index.html, from CMS.getPosts().
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  if (!window.CMS) {
    return;
  }

  function cardHTML(post) {
    const cover = CMS.coverBlock(post.title, post.image, hashVariant(post.id), post.title);

    return `
      <a class="blog-card reveal" href="/post?id=${encodeURIComponent(post.id)}">
        ${cover}
        <div class="blog-card-body">
          <span class="blog-tag">${Fikrah.escapeHTML(post.category || "Update")}</span>
          <h3>${Fikrah.escapeHTML(post.title)}</h3>
          <p>${Fikrah.escapeHTML(post.excerpt || "")}</p>
          <div class="blog-meta">
            <span>${Fikrah.escapeHTML(post.author || "Fikrah Summit")}</span>
            <span>${CMS.formatDate(post.date)}</span>
          </div>
        </div>
      </a>
    `;
  }

  function hashVariant(str) {
    let hash = 0;
    for (let i = 0; i < (str || "").length; i++) {
      hash = (hash + str.charCodeAt(i)) % CMS.GRADIENT_VARIANTS;
    }
    return hash;
  }

  /* -------------------------------------------------------
     FULL BLOG GRID (pages/blog.html)
     ------------------------------------------------------- */

  const grid = document.getElementById("blogGrid");

  if (grid) {

    const posts = await CMS.getPosts();
    const filterBar = document.getElementById("blogFilters");
    const empty = document.getElementById("blogEmpty");

    const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));

    function render(list) {
      grid.innerHTML = list.map(post => cardHTML(post)).join("");
      if (empty) {
        empty.style.display = list.length ? "none" : "block";
      }
      Fikrah.observeReveals(grid);
    }

    if (filterBar) {
      filterBar.innerHTML = `
        <button class="blog-filter active" data-category="all">All</button>
        ${categories.map(cat => `<button class="blog-filter" data-category="${Fikrah.escapeHTML(cat)}">${Fikrah.escapeHTML(cat)}</button>`).join("")}
      `;

      filterBar.addEventListener("click", event => {
        const btn = event.target.closest(".blog-filter");
        if (!btn) return;

        filterBar.querySelectorAll(".blog-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const category = btn.dataset.category;
        render(category === "all" ? posts : posts.filter(p => p.category === category));
      });
    }

    render(posts);
  }

  /* -------------------------------------------------------
     HOMEPAGE TEASER (index.html)
     ------------------------------------------------------- */

  const teaser = document.getElementById("blogTeaser");

  if (teaser) {
    const latest = (await CMS.getPosts()).slice(0, 3);

    teaser.innerHTML = latest.length
      ? latest.map(post => cardHTML(post)).join("")
      : '<div class="blog-empty">No posts yet — add one from the content manager.</div>';
    Fikrah.observeReveals(teaser);
  }

});
