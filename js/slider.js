/* =========================================================
   FIKRAH SUMMIT
   slider.js — homepage slider, built from the latest posts
   (see js/cms.js CMS.getFeaturedPosts and /admin/index.html).
   Editing the slider means editing posts — there's nothing
   separate to manage.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const mount = document.getElementById("fikrahSlider");

  if (!mount || !window.CMS) {
    return;
  }

  const posts = await CMS.getFeaturedPosts(5);

  if (!posts.length) {
    mount.innerHTML = '<div class="slider-empty">No posts yet — add one from the content manager and it will appear here.</div>';
    return;
  }

  function hashVariant(str) {
    let hash = 0;
    for (let i = 0; i < (str || "").length; i++) {
      hash = (hash + str.charCodeAt(i)) % CMS.GRADIENT_VARIANTS;
    }
    return hash;
  }

  let index = 0;
  let timer = null;
  const AUTOPLAY_MS = 6000;

  mount.innerHTML = `
    <div class="slider-viewport">
      <div class="slider-track">
        ${posts.map((post) => {
          const bgStyle = post.image ? ` style="background-image:url('${post.image}')"` : "";
          const bgClass = post.image ? " has-photo" : ` g-variant-${hashVariant(post.id || post.title)}`;

          return `
            <article class="slider-slide${bgClass}"${bgStyle}>
              ${post.image ? '<div class="slider-slide-overlay"></div>' : ""}
              <div class="slider-slide-content">
                <span class="slider-eyebrow">${Fikrah.escapeHTML(post.category || "Fikrah Summit")}</span>
                <h2>${Fikrah.escapeHTML(post.title || "")}</h2>
                <p>${Fikrah.escapeHTML(post.excerpt || "")}</p>
                <a class="btn btn-primary" href="/post?id=${encodeURIComponent(post.id)}">Read the Post →</a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
    ${posts.length > 1 ? `
      <button class="slider-arrow prev" aria-label="Previous post">‹</button>
      <button class="slider-arrow next" aria-label="Next post">›</button>
      <div class="slider-dots">
        ${posts.map((_, i) => `<span class="slider-dot${i === 0 ? " active" : ""}" data-index="${i}"></span>`).join("")}
      </div>
    ` : ""}
  `;

  const track = mount.querySelector(".slider-track");
  const dots = mount.querySelectorAll(".slider-dot");
  const prevBtn = mount.querySelector(".slider-arrow.prev");
  const nextBtn = mount.querySelector(".slider-arrow.next");

  function goTo(i) {
    index = (i + posts.length) % posts.length;
    track.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
    });
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  function restartAutoplay() {
    clearInterval(timer);
    if (posts.length > 1) {
      timer = setInterval(next, AUTOPLAY_MS);
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      next();
      restartAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prev();
      restartAutoplay();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      goTo(Number(dot.dataset.index));
      restartAutoplay();
    });
  });

  mount.addEventListener("mouseenter", () => clearInterval(timer));
  mount.addEventListener("mouseleave", restartAutoplay);
  mount.addEventListener("focusin", () => clearInterval(timer));
  mount.addEventListener("focusout", restartAutoplay);

  // Swipe support
  let touchStartX = null;

  mount.addEventListener("touchstart", event => {
    touchStartX = event.touches[0].clientX;
    clearInterval(timer);
  }, { passive: true });

  mount.addEventListener("touchend", event => {
    if (touchStartX === null) return;

    const deltaX = event.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) > 40) {
      deltaX < 0 ? next() : prev();
    }

    touchStartX = null;
    restartAutoplay();
  });

  goTo(0);
  restartAutoplay();
});
