document.addEventListener("DOMContentLoaded", function () {
  const privacyModal = document.getElementById("privacyModal");
  const termsModal = document.getElementById("termsModal");
  const privacyLink = document.querySelector(".privacy-link");
  const termsLink = document.querySelector(".terms-link");
  const closeButtons = document.querySelectorAll(".close");

  // Open privacy modal
  privacyLink.addEventListener("click", (e) => {
    e.preventDefault();
    privacyModal.style.display = "block";
  });

  // Open terms modal
  termsLink.addEventListener("click", (e) => {
    e.preventDefault();
    termsModal.style.display = "block";
  });

  // Close modals
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.parentElement.style.display = "none";
    });
  });

  // Close modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === privacyModal) privacyModal.style.display = "none";
    if (e.target === termsModal) termsModal.style.display = "none";
  });
});
