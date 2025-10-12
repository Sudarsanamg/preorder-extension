document.addEventListener("DOMContentLoaded", function () {
  const variantSelect = document.querySelector('[name="id"]'); // Shopify default variant selector
  const preorderVariants = document.querySelectorAll(".preorder-variant");
  const campaignData = document.getElementById("campaign-data");
  const campaignType = parseInt(campaignData?.dataset.campaignType, 10);

  if (!variantSelect || !preorderVariants.length) return;

  function showPreorderInfo(variantId) {
    preorderVariants.forEach(div => {
      const preorderBtn = document.querySelector(
        `.preorder-button[data-variant-id="${variantId}"]`
      );
      const isPreorder = preorderBtn?.dataset.preorder === "true";
      const inStock = preorderBtn?.dataset.instock === "true";

      let show = false;
      if (campaignType === 1 && !inStock) show = true;
      else if (campaignType === 2) show = true;
      else if (campaignType === 3 && inStock) show = true;

      if (div.dataset.variantId === variantId && isPreorder && show) {
        div.style.display = "block";
      } else {
        div.style.display = "none";
      }
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
