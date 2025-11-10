// document.addEventListener("DOMContentLoaded", () => {
//   const badge = document.getElementById("preorder-badge");
//   const variantData = document.getElementById("variant-data");
//   const variantSelect = document.querySelector("[name='id']"); 
//   const campaignData = document.getElementById("campaign-data"); 
//   if (!badge || !variantData || !variantSelect) return;

//   const campaignType = campaignData ? parseInt(campaignData.dataset.campaignType, 10) : null;

//   function toggleBadge(variantId) {
//     const preorder = variantData.dataset[`variant-${variantId}`] === "true";

//     let showBadge = false;
//     if (campaignType && preorder) {
    
//       const el = document.getElementById(`variant-${variantId}`);
//       const inStock = el ? el.dataset.instock === "true" : false;

//       if ((campaignType === 1 && !inStock) ||
//           campaignType === 2 ||
//           (campaignType === 3 && inStock)) {
//         showBadge = true;
//       }
//     }

//     badge.style.display = showBadge ? "inline-block" : "none";
//   }

//   toggleBadge(variantSelect.value);

//   // On variant change
//   variantSelect.addEventListener("change", (e) => {
//     toggleBadge(e.target.value);
//   });
// });


document.addEventListener("DOMContentLoaded", () => {
  const badge = document.getElementById("preorder-badge");
  const variantData = document.getElementById("variant-data");
  const campaignData = document.getElementById("campaign-data");

  if (!badge || !variantData) return;

 const enumToIntMap = {
  OUT_OF_STOCK: 1,
  ALLWAYS: 2,
  IN_STOCK: 3,
};

const campaignType =
  campaignData && campaignData.dataset.campaignType
    ? enumToIntMap[campaignData.dataset.campaignType]
    : null;

  // Helper: get current selected variant ID
  function getCurrentVariantId() {
    const variantSelect = document.querySelector("[name='id']");
    if (variantSelect && variantSelect.value) return variantSelect.value;

    const variantInput = document.querySelector("[data-selected-variant-id]");
    if (variantInput) return variantInput.getAttribute("data-selected-variant-id");

    const productForm = document.querySelector("form[action*='/cart/add']");
    if (productForm) {
      const input = productForm.querySelector("input[name='id']");
      if (input && input.value) return input.value;
    }

    return null;
  }

  // Show/hide preorder badge
  function toggleBadge(variantId) {
    const preorder = variantData.dataset[`variant-${variantId}`] === "true";
    let showBadge = false;

    if (campaignType && preorder) {
      const el = document.getElementById(`variant-${variantId}`);
      const inStock = el ? el.dataset.instock === "true" : false;

      if (
        (campaignType === 1 && !inStock) ||
        campaignType === 2 ||
        (campaignType === 3 )
      ) {
        showBadge = true;
      }
    }

    badge.style.display = showBadge ? "inline-block" : "none";
  }

  // Observe dynamic variant changes (Horizon, Dawn, etc.)
  const observer = new MutationObserver(() => {
    const variantId = getCurrentVariantId();
    if (variantId) toggleBadge(variantId);
  });

  const target = document.querySelector("form[action*='/cart/add']") || document.body;
  observer.observe(target, { subtree: true, childList: true, attributes: true });

  // Initial load
  const initialVariantId = getCurrentVariantId();
  if (initialVariantId) toggleBadge(initialVariantId);
});

