/* =========================================================
   FIKRAH SUMMIT
   app.js — global functionality loaded on every page
   ========================================================= */

// Exposed globally so navigation.js, sessions.js, community.js
// and forms.js can all trigger a toast without re-wiring it.
window.showToast = function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    return;
  }

  clearTimeout(window.__fikrahToastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  window.__fikrahToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
};

/* -----------------------------------------------------------
   SCROLL REVEAL
   Exposed as Fikrah.observeReveals(root) so content added
   later by async CMS-driven modules (blog/gallery/videos) can
   hook their newly-inserted .reveal elements into the same
   observer used for content that was already on the page at
   load — otherwise anything rendered after the initial pass
   stays stuck at opacity:0 forever.
   ----------------------------------------------------------- */

window.Fikrah = window.Fikrah || {};

var __fikrahRevealObserver = window.IntersectionObserver
  ? new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            __fikrahRevealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    )
  : null;

window.Fikrah.observeReveals = function observeReveals(root) {
  const elements = (root || document).querySelectorAll(".reveal:not(.visible)");

  if (!__fikrahRevealObserver) {
    // No IntersectionObserver support — just show everything immediately.
    elements.forEach(el => el.classList.add("visible"));
    return;
  }

  elements.forEach(el => __fikrahRevealObserver.observe(el));
};

document.addEventListener("DOMContentLoaded", () => {

  /* -------------------------------------------------------
     YEAR
     ------------------------------------------------------- */

  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }


  /* -------------------------------------------------------
     MOBILE NAVIGATION
     ------------------------------------------------------- */

  const mobileToggle = document.getElementById("mobileToggle");
  const navLinks = document.getElementById("navLinks");

  if (mobileToggle && navLinks) {

    mobileToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");

      mobileToggle.textContent = navLinks.classList.contains("open")
        ? "×"
        : "☰";
    });

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        mobileToggle.textContent = "☰";
      });
    });
  }


  /* -------------------------------------------------------
     DARK MODE
     ------------------------------------------------------- */

  const themeBtn = document.getElementById("themeBtn");
  const savedTheme = localStorage.getItem("fikrah-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  if (themeBtn) {

    themeBtn.addEventListener("click", () => {

      document.body.classList.toggle("dark");

      const theme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

      localStorage.setItem("fikrah-theme", theme);

      showToast(theme === "dark" ? "Dark mode enabled." : "Light mode enabled.");
    });
  }


  /* -------------------------------------------------------
     SEARCH OVERLAY
     ------------------------------------------------------- */

  const searchBtn = document.getElementById("searchBtn");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchClose = document.getElementById("searchClose");
  const globalSearch = document.getElementById("globalSearch");

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add("open");
    searchOverlay.setAttribute("aria-hidden", "false");
    setTimeout(() => globalSearch && globalSearch.focus(), 100);
  }

  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove("open");
    searchOverlay.setAttribute("aria-hidden", "true");
    if (globalSearch) globalSearch.value = "";
  }

  if (searchBtn) searchBtn.addEventListener("click", openSearch);
  if (searchClose) searchClose.addEventListener("click", closeSearch);

  if (searchOverlay) {
    searchOverlay.addEventListener("click", event => {
      if (event.target === searchOverlay) {
        closeSearch();
      }
    });
  }

  document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
      closeSearch();
    }

    if (
      event.key === "/" &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA"
    ) {
      event.preventDefault();
      openSearch();
    }
  });


  /* -------------------------------------------------------
     SCROLL REVEAL
     (elements already on the page at load — anything added
     later by async CMS modules calls Fikrah.observeReveals()
     itself after rendering)
     ------------------------------------------------------- */

  Fikrah.observeReveals();


  /* -------------------------------------------------------
     SMOOTH ANCHOR FALLBACK (in-page anchors only)
     ------------------------------------------------------- */

  document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", event => {

      const targetId = link.getAttribute("href");

      if (targetId === "#" || targetId === "") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

});
