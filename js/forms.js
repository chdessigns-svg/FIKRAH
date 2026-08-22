/* =========================================================
   FIKRAH SUMMIT
   forms.js — contact form, join form, and resource link
   placeholder handling.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* -------------------------------------------------------
     CONTACT FORM
     ------------------------------------------------------- */

  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", event => {

      event.preventDefault();

      const nameField = document.getElementById("name");
      const name = nameField ? nameField.value.trim() : "";

      contactForm.reset();

      showToast(`Thank you${name ? ", " + name : ""}! Your message has been prepared successfully.`);
    });
  }


  /* -------------------------------------------------------
     JOIN / MEMBERSHIP FORM
     ------------------------------------------------------- */

  const joinForm = document.getElementById("joinForm");

  if (joinForm) {
    joinForm.addEventListener("submit", event => {

      event.preventDefault();

      const nameField = document.getElementById("joinName");
      const name = nameField ? nameField.value.trim() : "";

      joinForm.reset();

      showToast(`Welcome${name ? ", " + name : ""}! Your membership application has been received.`);
    });
  }


  /* -------------------------------------------------------
     RESOURCE LINKS
     ------------------------------------------------------- */

  document.querySelectorAll(".resource-link").forEach(link => {

    link.addEventListener("click", event => {

      if (link.getAttribute("href") === "#") {
        event.preventDefault();
        showToast("The Fikrah resource library will be connected here.");
      }
    });
  });

});
