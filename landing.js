document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.getElementById("agreeCheckbox");
  const continueBtn = document.getElementById("continueBtn");

  checkbox.addEventListener("change", () => {
    continueBtn.disabled = !checkbox.checked;
  });

  continueBtn.addEventListener("click", () => {
    window.location.href = "Suraksha.html";
  });
});
