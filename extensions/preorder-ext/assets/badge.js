document.addEventListener("DOMContentLoaded", () => {
  const badge = document.getElementById("preorder-badge");
  const variantData = document.getElementById("variant-data");
  const variantSelect = document.querySelector("[name='id']"); // Shopify variant selector

  function toggleBadge(variantId) {
    const preorder = variantData.dataset[`variant-${variantId}`];
    badge.style.display = preorder == "true" ? "inline-block" : "none";
  }

  if (variantSelect && badge && variantData) {
    // Initial load
    toggleBadge(variantSelect.value);

    // On variant change
    variantSelect.addEventListener("change", (e) => {
      toggleBadge(e.target.value);
    });
  }
});
