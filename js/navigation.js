/* =========================================================
   FIKRAH SUMMIT
   navigation.js — active-section highlighting for pages
   that contain multiple in-page anchor sections (home).
   On single-topic pages this simply finds nothing and exits.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const sections = document.querySelectorAll("main section[id]");
  const navItems = document.querySelectorAll(".nav-links a");

  if (!sections.length || !navItems.length || !window.IntersectionObserver) {
    return;
  }

  const sectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {

          navItems.forEach(item => item.classList.remove("active"));

          const active = document.querySelector(
            `.nav-links a[href="#${entry.target.id}"]`
          );

          if (active) {
            active.classList.add("active");
          }
        }
      });
    },
    { rootMargin: "-30% 0px -60% 0px" }
  );

  sections.forEach(section => sectionObserver.observe(section));

});
