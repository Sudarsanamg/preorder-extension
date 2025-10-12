document.addEventListener("DOMContentLoaded", function () {
  const variantSelect = document.querySelector('[name="id"]');
  const variantPrices = document.querySelectorAll(".variant-price");
  const campaignData = document.getElementById("campaign-data");

  if (!variantSelect || !variantPrices.length) return;

  const campaignType = campaignData ? parseInt(campaignData.dataset.campaignType, 10) : null;

  function hideAllPrices() {
    variantPrices.forEach(el => el.style.display = "none");
  }

  function showVariantPrice(variantId) {
    hideAllPrices();

    const el = document.getElementById(`variant-${variantId}`);
    if (!el) return;

    const inStock = el.dataset.instock === "true";

    // Determine if we should show campaign prices
    let showCampaignPrice = false;
    if (campaignType) {
      if (campaignType === 1 && !inStock) showCampaignPrice = true;
      else if (campaignType === 2) showCampaignPrice = true;
      else if (campaignType === 3 && inStock) showCampaignPrice = true;
    }

    el.style.display = "block";

    const campaignPrice = el.querySelector(".campaign-price");
    const campaignCompare = el.querySelector(".campaign-compare");
    const fallbackPrice = el.querySelector(".fallback-price");

    if (showCampaignPrice && campaignPrice) {
      // Show campaign prices
      campaignPrice.style.display = "inline-block";
      if (campaignCompare) campaignCompare.style.display = "inline-block";
      if (fallbackPrice) fallbackPrice.style.display = "none";
    } else {
      // Show fallback/normal price
      if (campaignPrice) campaignPrice.style.display = "none";
      if (campaignCompare) campaignCompare.style.display = "none";
      if (fallbackPrice) fallbackPrice.style.display = "inline-block";
    }
  }

  // Initial load
  showVariantPrice(variantSelect.value);

  // On variant change
  variantSelect.addEventListener("change", function (e) {
    showVariantPrice(e.target.value);
  });
});
