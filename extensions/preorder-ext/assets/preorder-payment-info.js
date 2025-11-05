// document.addEventListener("DOMContentLoaded", function () {
//   const variantSelect = document.querySelector('[name="id"]'); // Shopify default variant selector
//   const preorderVariants = document.querySelectorAll(".preorder-variant");
//   const campaignData = document.getElementById("campaign-data");
//   const campaignType = parseInt(campaignData?.dataset.campaignType, 10);

//   if (!variantSelect || !preorderVariants.length) return;

//   function showPreorderInfo(variantId) {
//     preorderVariants.forEach(div => {
//       const preorderBtn = document.querySelector(
//         `.preorder-button[data-variant-id="${variantId}"]`
//       );
//       const isPreorder = preorderBtn?.dataset.preorder === "true";
//       const inStock = preorderBtn?.dataset.instock === "true";

//       let show = false;
//       if (campaignType === 1 && !inStock) show = true;
//       else if (campaignType === 2) show = true;
//       else if (campaignType === 3 && inStock) show = true;

//       if (div.dataset.variantId === variantId && isPreorder && show) {
//         div.style.display = "block";
//       } else {
//         div.style.display = "none";
//       }
//     });
//   }

//   // Initial load — show info for selected variant
//   const initialVariant = variantSelect.value;
//   showPreorderInfo(initialVariant);

//   // When variant changes
//   variantSelect.addEventListener("change", function (event) {
//     showPreorderInfo(event.target.value);
//   });
// });



document.addEventListener("DOMContentLoaded", function () {
  const campaignData = document.getElementById("campaign-data");
  const campaignType = parseInt(campaignData?.dataset.campaignType, 10);
  const preorderVariants = document.querySelectorAll(".preorder-variant");

  if (!preorderVariants.length) return;

  // Helper: get current selected variant ID
  function getCurrentVariantId() {
    const variantSelect = document.querySelector('[name="id"]');
    if (variantSelect && variantSelect.value) return variantSelect.value;

    const variantInput = document.querySelector('[data-selected-variant-id]');
    if (variantInput) return variantInput.getAttribute('data-selected-variant-id');

    const productForm = document.querySelector("form[action*='/cart/add']");
    if (productForm) {
      const input = productForm.querySelector("input[name='id']");
      if (input && input.value) return input.value;
    }
    return null;
  }

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

  // Observe variant changes dynamically (works for Horizon, Dawn, etc.)
  const observer = new MutationObserver(() => {
    const variantId = getCurrentVariantId();
    if (variantId) showPreorderInfo(variantId);
  });

  // Watch the variant selector or the entire form
  const target = document.querySelector("form[action*='/cart/add']") || document.body;
  observer.observe(target, { subtree: true, childList: true, attributes: true });

  // Initial load
  const initialVariantId = getCurrentVariantId();
  if (initialVariantId) showPreorderInfo(initialVariantId);
});
