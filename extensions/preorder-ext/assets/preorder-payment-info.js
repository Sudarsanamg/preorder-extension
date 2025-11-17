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

  const enumToIntMap = {
    OUT_OF_STOCK: 1,
    ALWAYS: 2,
    IN_STOCK: 3,
  };

  // Default to ALWAYS if missing
  const campaignType = campaignData?.dataset.campaignType
    ? enumToIntMap[campaignData.dataset.campaignType] || 2
    : 2;

  // Universal variant getter
  function getCurrentVariantId() {
    const select = document.querySelector("select[name='id']");
    if (select && select.value) return select.value;
    const checked = document.querySelector("input[name='id']:checked");
    if (checked) return checked.value;
    const hidden = document.querySelector("input[name='id'][type='hidden']");
    if (hidden && hidden.value) return hidden.value;
    return null;
  }

  // Main display logic
  function showPreorderInfo(variantId) {
    const preorderVariants = document.querySelectorAll(".preorder-variant");
    if (!preorderVariants.length) return;

    preorderVariants.forEach((div) => {
      const preorderBtn = document.querySelector(
        `.preorder-button[data-variant-id="${variantId}"]`
      );
      if (!preorderBtn) {
        div.style.display = "none";
        return;
      }

      const isPreorder = preorderBtn.dataset.preorder === "true";
      const inStock = preorderBtn.dataset.instock === "true";

      let show = false;
      // console.log(campaignType, 'campaignType');
      // console.log(preorderBtn.dataset.instock, 'inStock');

      if (campaignType === 1 && inStock === false) show = true;
      else if (campaignType === 2) show = true;
      else if (campaignType === 3 && inStock) show = true;

      console.log(show, 'show');

      if (div.dataset.variantId === variantId && isPreorder && show) {
        div.style.display = "block";
      } else {
        div.style.display = "none";
      }
    });
  }

  // Wait until product form and preorder buttons exist
  function initWhenReady() {
    const productForm = document.querySelector("form[action*='/cart/add']");
    const preorderBtns = document.querySelectorAll(".preorder-button");
    if (!productForm || !preorderBtns.length) {
      setTimeout(initWhenReady, 250);
      return;
    }

    // Observe variant change
    productForm.addEventListener("change", (e) => {
      if (e.target.name === "id") {
        const variantId = getCurrentVariantId();
        if (variantId) showPreorderInfo(variantId);
      }
    });

    // MutationObserver for dynamic theme updates
    const observer = new MutationObserver(() => {
      const variantId = getCurrentVariantId();
      if (variantId) showPreorderInfo(variantId);
    });
    observer.observe(productForm, { childList: true, subtree: true, attributes: true });

    // Initial render
    const initialVariant = getCurrentVariantId();
    if (initialVariant) showPreorderInfo(initialVariant);
  }

  initWhenReady();
});
