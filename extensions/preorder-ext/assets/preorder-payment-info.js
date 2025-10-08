document.addEventListener("DOMContentLoaded", function () {
  const variantSelect = document.querySelector('[name="id"]'); // Shopify default variant selector
  const preorderVariants = document.querySelectorAll(".preorder-variant");

  if (!variantSelect || !preorderVariants.length) return;

  function showPreorderInfo(variantId) {
    preorderVariants.forEach(div => {
      div.style.display = div.dataset.variantId === variantId ? "block" : "none";
    });
  }

  // Initial load — show info for selected variant
  const initialVariant = variantSelect.value;
  showPreorderInfo(initialVariant);

  // When variant changes
  variantSelect.addEventListener("change", function (event) {
    showPreorderInfo(event.target.value);
  });
});
