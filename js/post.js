/* =========================================================
   FIKRAH SUMMIT
   post.js — renders a single post on pages/post.html based
   on the ?id= query parameter, from CMS.getPost().
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const mount = document.getElementById("postMount");

  if (!mount || !window.CMS) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const post = id ? CMS.getPost(id) : null;

  if (!post) {
    mount.innerHTML = `
      <div class="blog-empty">
        <p style="margin-bottom: 18px;">We couldn't find that post — it may have been removed or the link is out of date.</p>
        <a href="blog.html" class="btn btn-primary">← Back to the Blog</a>
      </div>
    `;
    return;
  }

  document.title = post.title + " | Fikrah Summit";

  const paragraphs = (post.body || "")
    .split(/\n\s*\n/)
    .map(p => `<p>${Fikrah.escapeHTML(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

  const cover = post.image
    ? `<div class="cms-cover post-cover" style="background-image:url('${post.image}')"></div>`
    : `<div class="cms-cover post-cover g-variant-${(post.title || "F").charCodeAt(0) % CMS.GRADIENT_VARIANTS}">
         <span class="cms-cover-letter">${Fikrah.escapeHTML((post.title || "F").charAt(0))}</span>
       </div>`;

  mount.innerHTML = `
    <div class="breadcrumb">
      <a href="../index.html">Home</a><span>/</span>
      <a href="blog.html">Blog</a><span>/</span>
      <strong>${Fikrah.escapeHTML(post.title)}</strong>
    </div>

    <div class="post-header">
      <span class="section-label">${Fikrah.escapeHTML(post.category || "Update")}</span>
      <h1 class="section-title">${Fikrah.escapeHTML(post.title)}</h1>

      <div class="post-meta-row">
        <span>${Fikrah.escapeHTML(post.author || "Fikrah Summit")}</span>
        <span>${CMS.formatDate(post.date)}</span>
      </div>
    </div>

    ${cover}

    <div class="post-body">${paragraphs}</div>

    <div class="hero-actions" style="margin-top: 20px;">
      <a href="blog.html" class="btn btn-secondary">← Back to the Blog</a>
    </div>
  `;
});
