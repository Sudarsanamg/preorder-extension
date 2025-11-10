document.addEventListener("DOMContentLoaded", function () {
  // Shopify default buttons
  const buyNowBtn = document.querySelector("shopify-buy-it-now-button button");
  const addToCartBtn = document.querySelector(
    "form[action*='/cart/add'] [type='submit']"
  );

  // Product & campaign data
  const productData = document.getElementById("product-data");
  const isPreorderProduct = productData?.dataset.preorder === "true";
  const campaignData = document.getElementById("campaign-data");
  const enumToIntMap = {
  OUT_OF_STOCK: 1,
  ALLWAYS: 2,
  IN_STOCK: 3,
};

const campaignType =
  campaignData && campaignData.dataset.campaignType
    ? enumToIntMap[campaignData.dataset.campaignType]
    : 10;

  // const campaignType = parseInt(campaignData?.dataset.campaignType, 10);
  // Variant selection
  const variantSelect = document.querySelector("[name='id']");
  const preorderButtons = document.querySelectorAll(".preorder-button");

 function updatePreorderButton(variantId) {
  let showingPreorder = false;

  preorderButtons.forEach((btn) => {
    if (btn.dataset.variantId !== variantId) {
      btn.style.display = "none";
      return;
    }
   const quantityError = document.getElementById("quantity-error");
   quantityError.textContent="";

    const isPreorder = btn.dataset.preorder == 'true';
    const maxUnits = parseInt(btn.dataset.maxUnits || "0", 10);
    const unitsSold = parseInt(btn.dataset.unitsSold || "0", 10);
    const inStock = Number(unitsSold) < Number(maxUnits);
    const isVariantAvailable = btn.dataset.instock === "true";
    // Apply campaign rules
    let showPreorder = false;
    if (campaignType === 1 && !isVariantAvailable && inStock) showPreorder = true;
    else if (campaignType === 2 || campaignType === 3) showPreorder = true;

    // console.log(btn.dataset.preorder,'preorder');
    // console.log(campaignType, 'campaignType');
    // console.log(isPreorder, 'isPreorder');
    // console.log(inStock, 'inStock');
    // console.log(maxUnits, 'maxUnits');
    // console.log(unitsSold, 'unitsSold');
    // console.log(btn.dataset.instock, 'isVariantAvailable');
    // console.log(showPreorder, 'showPreorder');

    if (isPreorder && showPreorder) {
      btn.style.display = "flex";

      // Show Sold Out if stock is zero or maxUnits reached
      if ( !inStock ) {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
        btn.querySelector(".button-text").textContent = "Sold Out";
      } else {
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.querySelector(".button-text").textContent =
          btn.dataset.originalText || "Pre-order";
      }

      showingPreorder = true;
    } else {
      btn.style.display = "none";
    }
  });

  // Show/hide normal buttons
  if (showingPreorder) {
    if (buyNowBtn) buyNowBtn.style.display = "none";
    if (addToCartBtn) addToCartBtn.style.display = "none";
  } else {
    if (buyNowBtn) buyNowBtn.style.display = "inline-block";
    if (addToCartBtn) addToCartBtn.style.display = "inline-block";
  }
}


  // Initial load
  if (variantSelect) {
    preorderButtons.forEach((btn) => {
      btn.dataset.originalText = btn.querySelector(".button-text").textContent;
    });

    updatePreorderButton(variantSelect.value);

    // On variant change
    variantSelect.addEventListener("change", (e) => {
      console.log("Variant changed");
      updatePreorderButton(e.target.value);
    });
  }

  // Preorder button click handler
  preorderButtons.forEach((btn) => {
    const sellingPlanData = document.getElementById("selling-plan-data");
    if (!sellingPlanData) return;

    btn.addEventListener("click", async () => {
      const variantId = btn.dataset.variantId;
      const sellingPlanId = sellingPlanData.dataset.sellingPlan;
      const textEl = btn.querySelector(".button-text");
      const quantityInput = document.querySelector('input[name="quantity"]');
      const quantity = parseInt(quantityInput?.value || "1", 10);
      const maxUnits = parseInt(btn.dataset.maxUnits || "0", 10);
      const unitsSold = parseInt(btn.dataset.unitsSold || "0", 10);
      const remainingUnits = maxUnits - unitsSold;
      const quantityError = document.getElementById("quantity-error");

      textEl.textContent = "Adding to cart...";
      btn.disabled = true;
      if (quantity > maxUnits) {
        quantityError.textContent = `You can only preorder up to ${remainingUnits} units for this product.`;
        textEl.textContent = btn.dataset.originalText || "Pre-order";
        btn.disabled = false;
        return;
      }

      try {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                id: variantId,
                quantity: quantity,
                selling_plan: sellingPlanId,
              },
            ],
          }),
        });

        const data = await res.json();
        console.log("Added to cart:", data);
        window.location.href = "/cart";
      } catch (err) {
        console.error("Error adding to cart:", err);
        textEl.textContent = btn.dataset.originalText || "Pre-order";
        btn.disabled = false;
      }
    });
  });
});



// document.addEventListener("DOMContentLoaded", function () {
//   // 🧠 Utility: Wait for an element (for themes that load product forms late)
//   function waitForElement(selector, callback) {
//     const el = document.querySelector(selector);
//     if (el) return callback(el);
//     const observer = new MutationObserver(() => {
//       const el = document.querySelector(selector);
//       if (el) {
//         observer.disconnect();
//         callback(el);
//       }
//     });
//     observer.observe(document.body, { childList: true, subtree: true });
//   }

//   // 🧩 Helper: Find Buy Now button including inside Shadow DOM
//   function getBuyNowButton() {
//     // Try normal DOM first
//     const direct = document.querySelector(
//       ".shopify-payment-button__button, [name='checkout'], .shopify-payment-button__button--unbranded"
//     );
//     if (direct) return direct;

//     // Try inside shadow DOM
//     const host = document.querySelector("shopify-buy-it-now-button");
//     if (host && host.shadowRoot) {
//       const shadowBtn = host.shadowRoot.querySelector("button");
//       if (shadowBtn) return shadowBtn;
//     }

//     // As a final fallback, return null
//     return null;
//   }

//   // 🧩 Universal selectors
//   const selectors = {
//     addToCart: "form[action*='/cart/add'] [type='submit'], .product-form__submit, button[name='add']",
//     variant: "[name='id'], input[name='id']:checked, select[name='id']",
//   };

//   waitForElement("form[action*='/cart/add']", (form) => {
//     const addToCartBtn = document.querySelector(selectors.addToCart);
//     const buyNowBtn = getBuyNowButton(); // ✅ uses shadow DOM fix
//     const preorderButtons = document.querySelectorAll(".preorder-button");
//     const productData = document.getElementById("product-data");
//     const sellingPlanData = document.getElementById("selling-plan-data");
//     const quantityError = document.getElementById("quantity-error");
//       const campaignData = document.getElementById("campaign-data");

//     const isPreorderProduct = productData?.dataset.preorder === "true";
//     const enumToIntMap = { OUT_OF_STOCK: 1, ALLWAYS: 2, IN_STOCK: 3 };

//      const campaignType =
//   campaignData && campaignData.dataset.campaignType
//     ? enumToIntMap[campaignData.dataset.campaignType]
//     : 10;

//     const campaignTypeInt = enumToIntMap[campaignType] || 10;

//     // 🔍 Helper: get current variant
//     function getCurrentVariant() {
//       const select = document.querySelector("select[name='id']");
//       if (select) return select.value;
//       const checked = document.querySelector("input[name='id']:checked");
//       if (checked) return checked.value;
//       const hidden = document.querySelector("input[name='id'][type='hidden']");
//       if (hidden) return hidden.value;
//       return null;
//     }

//     // 🔄 Update preorder visibility
//     function updatePreorder(variantId) {
//       let showingPreorder = false;
//       preorderButtons.forEach((btn) => {
//         if (btn.dataset.variantId !== variantId) {
//           btn.style.display = "none";
//           return;
//         }

//         const isPreorder = btn.dataset.preorder === "true";
//         const maxUnits = parseInt(btn.dataset.maxUnits || "0");
//         const unitsSold = parseInt(btn.dataset.unitsSold || "0");
//         const inStock = unitsSold < maxUnits;
//         const isVariantAvailable = btn.dataset.instock === "true";

//         let show = false;
//         // console.log(typeof  btn.dataset.preorder)
//     console.log(btn.dataset.preorder,'preorder');
//     console.log(campaignType, 'campaignType');
//     console.log(isPreorder, 'isPreorder');
//     console.log(inStock, 'inStock');
//     console.log(maxUnits, 'maxUnits');
//     console.log(unitsSold, 'unitsSold');
//     console.log(btn.dataset.instock, 'isVariantAvailable');
//         if (campaignTypeInt === 1 && !isVariantAvailable && inStock) show = true;
//         else if (campaignTypeInt === 2) show = true;
//         else if (campaignTypeInt === 3 && isVariantAvailable && inStock) show = true;

//         if (isPreorder && show) {
//           btn.style.display = "flex";
//           showingPreorder = true;
//         } else {
//           btn.style.display = "none";
//         }
//       });

//       // ✅ Toggle normal buttons (includes Buy Now inside shadow DOM)
//       if (showingPreorder) {
//         if (addToCartBtn) addToCartBtn.style.display = "none";

//         const buyBtn = getBuyNowButton();
//         if (buyBtn) buyBtn.style.display = "none";

//         // Also hide the wrapper if needed
//         const wrapper = document.querySelector(".shopify-payment-button");
//         if (wrapper) wrapper.style.display = "none";
//       } else {
//         if (addToCartBtn) addToCartBtn.style.display = "";
//         const buyBtn = getBuyNowButton();
//         if (buyBtn) buyBtn.style.display = "";
//         const wrapper = document.querySelector(".shopify-payment-button");
//         if (wrapper) wrapper.style.display = "";
//       }
//     }

//     // Initial run
//     let variantId = getCurrentVariant();
//     updatePreorder(variantId);

//     // React on variant change
//     form.addEventListener("change", (e) => {
//       if (e.target.name === "id") {
//         variantId = getCurrentVariant();
//         updatePreorder(variantId);
//       }
//     });

//     // 🧩 Preorder button click handler (✅ correct variant logic)
//     preorderButtons.forEach((btn) => {
//       btn.addEventListener("click", async () => {
//         let currentVariantId = getCurrentVariant() || btn.dataset.variantId;
//         const sellingPlanId = sellingPlanData?.dataset.sellingPlan || "";
//         const textEl = btn.querySelector(".button-text");
//         const quantityInput = document.querySelector('input[name="quantity"]');
//         const quantity = parseInt(quantityInput?.value || "1");
//         const maxUnits = parseInt(btn.dataset.maxUnits || "0");
//         const unitsSold = parseInt(btn.dataset.unitsSold || "0");
//         const remaining = maxUnits - unitsSold;

//         if (quantity > remaining) {
//           quantityError.textContent = `Only ${remaining} left for preorder.`;
//           return;
//         }

//         textEl.textContent = "Adding to cart...";
//         btn.disabled = true;

//         try {
//           await fetch("/cart/add.js", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Accept: "application/json",
//             },
//             body: JSON.stringify({
//               items: [
//                 {
//                   id: Number(currentVariantId),
//                   quantity: quantity,
//                   ...(sellingPlanId ? { selling_plan: sellingPlanId } : {}),
//                 },
//               ],
//             }),
//           });

//           window.location.href = "/cart";
//         } catch (err) {
//           console.error("Error adding to cart:", err);
//         } finally {
//           textEl.textContent = btn.dataset.originalText || "Pre-order";
//           btn.disabled = false;
//         }
//       });
//     });
//   });
// });
