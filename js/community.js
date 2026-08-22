/* =========================================================
   FIKRAH SUMMIT
   community.js — member directory search (community.html)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const memberSearch = document.getElementById("memberSearch");
  const memberCards = document.querySelectorAll(".member");
  const memberEmpty = document.getElementById("memberEmpty");

  if (!memberSearch || !memberCards.length) {
    return;
  }

  memberSearch.addEventListener("input", event => {

    const query = event.target.value.trim().toLowerCase();
    let visibleCount = 0;

    memberCards.forEach(card => {

      const text = card.textContent.toLowerCase();
      const matches = text.includes(query);

      card.style.display = matches ? "" : "none";

      if (matches) {
        visibleCount += 1;
      }
    });

    if (memberEmpty) {
      memberEmpty.style.display = visibleCount === 0 ? "block" : "none";
    }
  });

});
