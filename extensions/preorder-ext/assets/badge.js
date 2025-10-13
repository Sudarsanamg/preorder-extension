document.addEventListener("DOMContentLoaded", () => {
  const badge = document.getElementById("preorder-badge");
  const variantData = document.getElementById("variant-data");
  const variantSelect = document.querySelector("[name='id']"); 
  const campaignData = document.getElementById("campaign-data"); 
  if (!badge || !variantData || !variantSelect) return;

  const campaignType = campaignData ? parseInt(campaignData.dataset.campaignType, 10) : null;

  function toggleBadge(variantId) {
    const preorder = variantData.dataset[`variant-${variantId}`] === "true";

    let showBadge = false;
    if (campaignType && preorder) {
    
      const el = document.getElementById(`variant-${variantId}`);
      const inStock = el ? el.dataset.instock === "true" : false;

      if ((campaignType === 1 && !inStock) ||
          campaignType === 2 ||
          (campaignType === 3 && inStock)) {
        showBadge = true;
      }
    }

    badge.style.display = showBadge ? "inline-block" : "none";
  }

  toggleBadge(variantSelect.value);

  // On variant change
  variantSelect.addEventListener("change", (e) => {
    toggleBadge(e.target.value);
  });
});
