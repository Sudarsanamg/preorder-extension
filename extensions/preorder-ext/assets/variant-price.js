document.addEventListener("DOMContentLoaded", function () {
  const variantSelect = document.querySelector('[name="id"]'); // Shopify default variant select
  const variantPrices = document.querySelectorAll(".variant-price");
  console.log(variantPrices)

  function hideAllPrices() {
    variantPrices.forEach((el) => (el.style.display = "none"));
  }

  function showVariantPrice(variantId) {
    hideAllPrices();
    const el = document.getElementById(`variant-${variantId}`);
    if (el) el.style.display = "block";
  }

  // On page load, hide all prices
  hideAllPrices();

  // Show price if a variant is pre-selected
  if (variantSelect.value) {
    showVariantPrice(variantSelect.value);
  }

  // Listen for variant change
  variantSelect.addEventListener("change", function (e) {
    const variantId = e.target.value;
    showVariantPrice(variantId);
  });
});
