/* =========================================================
   FIKRAH SUMMIT
   sessions.js — countdown timer, animated counters,
   and the session registration modal.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* -------------------------------------------------------
     COUNTDOWN
     -------------------------------------------------------
     The summit information available does not specify the
     exact date of the next session. We use the coming
     Saturday as a placeholder front-end demonstration date.
     Replace NEXT_EVENT_DATE with the confirmed date once
     it is published.
     ------------------------------------------------------- */

  const countdownEl = document.getElementById("countdown");

  if (countdownEl) {

    const nextSaturday = new Date();
    nextSaturday.setHours(0, 0, 0, 0);

    const currentDay = nextSaturday.getDay();
    const daysUntilSaturday = (6 - currentDay + 7) % 7;

    nextSaturday.setDate(
      nextSaturday.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday)
    );

    nextSaturday.setHours(10, 0, 0, 0);

    const NEXT_EVENT_DATE = nextSaturday.getTime();

    function updateCountdown() {

      const distance = NEXT_EVENT_DATE - Date.now();

      const daysEl = document.getElementById("days");
      const hoursEl = document.getElementById("hours");
      const minutesEl = document.getElementById("minutes");
      const secondsEl = document.getElementById("seconds");

      if (distance <= 0) {
        if (daysEl) daysEl.textContent = "00";
        if (hoursEl) hoursEl.textContent = "00";
        if (minutesEl) minutesEl.textContent = "00";
        if (secondsEl) secondsEl.textContent = "00";
        return;
      }

      const days = Math.floor(distance / 86400000);
      const hours = Math.floor((distance % 86400000) / 3600000);
      const minutes = Math.floor((distance % 3600000) / 60000);
      const seconds = Math.floor((distance % 60000) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }


  /* -------------------------------------------------------
     ANIMATED STATISTICS
     ------------------------------------------------------- */

  const statNumbers = document.querySelectorAll("[data-count]");

  if (statNumbers.length) {

    if (!window.IntersectionObserver) {
      // Fallback: just show the final numbers immediately.
      statNumbers.forEach(el => {
        const target = Number(el.dataset.count);
        el.textContent = target + (target > 20 ? "+" : "");
      });
    } else {

    const countObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {

          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target;
          const target = Number(element.dataset.count);
          const duration = 1200;
          const start = performance.now();

          function animate(now) {

            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(target * eased);

            element.textContent = current + (target > 20 ? "+" : "");

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }

          requestAnimationFrame(animate);
          countObserver.unobserve(element);
        });
      },
      { threshold: 0.8 }
    );

    statNumbers.forEach(number => countObserver.observe(number));
    }
  }


  /* -------------------------------------------------------
     REGISTRATION MODAL
     ------------------------------------------------------- */

  const registrationModal = document.getElementById("registrationModal");
  const registerBtn = document.getElementById("registerBtn");
  const joinBtn = document.getElementById("joinBtn");
  const closeRegistration = document.getElementById("closeRegistration");

  function openRegistration() {

    if (!registrationModal) return;

    registrationModal.classList.add("open");
    registrationModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      const regName = document.getElementById("regName");
      if (regName) regName.focus();
    }, 100);
  }

  function closeRegistrationModal() {

    if (!registrationModal) return;

    registrationModal.classList.remove("open");
    registrationModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (registerBtn) registerBtn.addEventListener("click", openRegistration);
  if (joinBtn) joinBtn.addEventListener("click", openRegistration);
  if (closeRegistration) closeRegistration.addEventListener("click", closeRegistrationModal);

  if (registrationModal) {
    registrationModal.addEventListener("click", event => {
      if (event.target === registrationModal) {
        closeRegistrationModal();
      }
    });
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeRegistrationModal();
    }
  });

  const registrationForm = document.getElementById("registrationForm");

  if (registrationForm) {
    registrationForm.addEventListener("submit", event => {
      event.preventDefault();
      closeRegistrationModal();
      registrationForm.reset();
      showToast("Thank you! Your registration interest has been received.");
    });
  }

});
