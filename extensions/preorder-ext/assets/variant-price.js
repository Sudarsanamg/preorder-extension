// document.addEventListener("DOMContentLoaded", function () {
//   const variantSelect = document.querySelector('[name="id"]');
//   const variantPrices = document.querySelectorAll(".variant-price");
//   const campaignData = document.getElementById("campaign-data");

//   if (!variantSelect || !variantPrices.length) return;

//   const campaignType = campaignData ? parseInt(campaignData.dataset.campaignType, 10) : null;

//   function hideAllPrices() {
//     variantPrices.forEach(el => el.style.display = "none");
//   }

//   function showVariantPrice(variantId) {
//     hideAllPrices();

//     const el = document.getElementById(`variant-${variantId}`);
//     if (!el) return;

//     const inStock = el.dataset.instock === "true";

//     // Determine if we should show campaign prices
//     let showCampaignPrice = false;
//     if (campaignType) {
//       if (campaignType === 1 && !inStock) showCampaignPrice = true;
//       else if (campaignType === 2) showCampaignPrice = true;
//       else if (campaignType === 3 && inStock) showCampaignPrice = true;
//     }

//     el.style.display = "block";

//     const campaignPrice = el.querySelector(".campaign-price");
//     const campaignCompare = el.querySelector(".campaign-compare");
//     const fallbackPrice = el.querySelector(".fallback-price");

//     if (showCampaignPrice && campaignPrice) {
//       // Show campaign prices
//       campaignPrice.style.display = "inline-block";
//       if (campaignCompare) campaignCompare.style.display = "inline-block";
//       if (fallbackPrice) fallbackPrice.style.display = "none";
//     } else {
//       // Show fallback/normal price
//       if (campaignPrice) campaignPrice.style.display = "none";
//       if (campaignCompare) campaignCompare.style.display = "none";
//       if (fallbackPrice) fallbackPrice.style.display = "inline-block";
//     }
//   }

//   // Initial load
//   showVariantPrice(variantSelect.value);

//   // On variant change
//   variantSelect.addEventListener("change", function (e) {
//     showVariantPrice(e.target.value);
//   });
// });



document.addEventListener("DOMContentLoaded", function () {
  const campaignData = document.getElementById("campaign-data");
  const campaignType = campaignData ? parseInt(campaignData.dataset.campaignType, 10) : null;

  function hideAllPrices() {
    document.querySelectorAll(".variant-price").forEach(el => {
      el.style.display = "none";
    });
  }

  function showVariantPrice(variantId) {
    hideAllPrices();

    const el = document.getElementById(`variant-${variantId}`);
    if (!el) return;

    const inStock = el.dataset.instock === "true";
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
      campaignPrice.style.display = "inline-block";
      if (campaignCompare) campaignCompare.style.display = "inline-block";
      if (fallbackPrice) fallbackPrice.style.display = "none";
    } else {
      if (campaignPrice) campaignPrice.style.display = "none";
      if (campaignCompare) campaignCompare.style.display = "none";
      if (fallbackPrice) fallbackPrice.style.display = "inline-block";
    }
  }

  function attachVariantListener() {
    const variantSelect = document.querySelector('[name="id"]');
    if (!variantSelect) return;

    // Initial load
    showVariantPrice(variantSelect.value);

    // Native <select> change
    variantSelect.addEventListener("change", e => {
      showVariantPrice(e.target.value);
    });
  }

  attachVariantListener();

  // 🧩 Listen to Shopify theme variant events (for dynamic themes like Dawn)
  document.addEventListener("variant:change", function (event) {
    const variant = event.detail?.variant;
    if (variant?.id) {
      showVariantPrice(variant.id);
    }
  });

  // 🩹 In some themes, product form is re-rendered — reattach listener
  const observer = new MutationObserver(() => {
    if (!document.querySelector('[name="id"]')) return;
    attachVariantListener();
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

