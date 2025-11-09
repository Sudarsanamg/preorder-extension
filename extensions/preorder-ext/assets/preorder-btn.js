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
    // console.log(typeof  btn.dataset.preorder)
    // console.log(btn.dataset.preorder,'preorder');
    // console.log(campaignType, 'campaignType');
    // console.log(isPreorder, 'isPreorder');
    // console.log(inStock, 'inStock');
    // console.log(maxUnits, 'maxUnits');
    // console.log(unitsSold, 'unitsSold');
    // console.log(btn.dataset.instock, 'isVariantAvailable');
    let showPreorder = false;
    if (campaignType === 1 && !isVariantAvailable && inStock) showPreorder = true;
    else if (campaignType === 2) showPreorder = true;
    else if (campaignType === 3 && isVariantAvailable && inStock) showPreorder = true;

    if (isPreorder && showPreorder) {
      btn.style.display = "flex";

      // Show Sold Out if stock is zero or maxUnits reached
      if (!inStock) {
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


// document.addEventListener("DOMContentLoaded", () => {
//   // Buttons
//   const buyNowBtn = () => document.querySelector("shopify-buy-it-now-button button");
//   const addToCartBtn = () => document.querySelector("form[action*='/cart/add'] [type='submit']");

//   // Product & campaign data (assumes these exist somewhere on page or inside product block)
//   const productData = () => document.getElementById("product-data");
//   const campaignData = () => document.getElementById("campaign-data");
//   const campaignType = () => parseInt(campaignData()?.dataset.campaignType || "0", 10);
//   const preorderButtons = () => Array.from(document.querySelectorAll(".preorder-button"));

//   // Debounce helper
//   function debounce(fn, wait = 120) {
//     let t;
//     return (...args) => {
//       clearTimeout(t);
//       t = setTimeout(() => fn(...args), wait);
//     };
//   }

//   // Update UI for given variant id (string)
//   function updatePreorderButton(variantId) {
//     if (!variantId) return;
//     const btns = preorderButtons();
//     if (!btns.length) return;

//     let showingPreorder = false;

//     btns.forEach((btn) => {
//       if (btn.dataset.variantId !== variantId) {
//         btn.style.display = "none";
//         return;
//       }

//       const quantityErrorEl = document.getElementById("quantity-error");
//       if (quantityErrorEl) quantityErrorEl.textContent = "";

//       const isPreorder = btn.dataset.preorder === "true";
//       const maxUnits = parseInt(btn.dataset.maxUnits || "0", 10);
//       const unitsSold = parseInt(btn.dataset.unitsSold || "0", 10);
//       const inStock = unitsSold < maxUnits;

//       let showPreorder = false;
//       const cType = campaignType();
//       if (cType === 1 && !inStock) showPreorder = true;
//       else if (cType === 2) showPreorder = true;
//       else if (cType === 3 && inStock) showPreorder = true;

//       if (isPreorder && showPreorder) {
//         btn.style.display = "flex";
//         const textEl = btn.querySelector(".button-text");
//         if (!inStock) {
//           btn.style.opacity = "0.5";
//           btn.style.pointerEvents = "none";
//           if (textEl) textEl.textContent = "Sold Out";
//         } else {
//           btn.style.opacity = "1";
//           btn.style.pointerEvents = "auto";
//           if (textEl) textEl.textContent = btn.dataset.originalText || "Pre-order";
//         }
//         showingPreorder = true;
//       } else {
//         btn.style.display = "none";
//       }
//     });

//     // Toggle default buttons
//     if (showingPreorder) {
//       if (buyNowBtn()) buyNowBtn().style.display = "none";
//       if (addToCartBtn()) addToCartBtn().style.display = "none";
//     } else {
//       if (buyNowBtn()) buyNowBtn().style.display = "inline-block";
//       if (addToCartBtn()) addToCartBtn().style.display = "inline-block";
//     }
//   }

//   // Save original text once (safe)
//   function captureOriginalButtonText() {
//     preorderButtons().forEach((b) => {
//       try {
//         const t = b.querySelector(".button-text")?.textContent || "";
//         if (!b.dataset.originalText) b.dataset.originalText = t;
//       } catch (e) {}
//     });
//   }

//   // Read variant id from various places
//   function readCurrentVariantId() {
//     // 1) common hidden/select input
//     const idInput = document.querySelector("[name='id']");
//     if (idInput?.value) return idInput.value;

//     // 2) some themes render data-variant-id on active option/button
//     const activeEl = document.querySelector("[data-variant-id].is-active, [data-variant-id].active");
//     if (activeEl) return activeEl.dataset.variantId;

//     // 3) a selected radio/option
//     const sel = document.querySelector("input[name='id']:checked");
//     if (sel?.value) return sel.value;

//     // 4) try cart form dataset if theme stores variant there
//     const pf = document.querySelector("form[action*='/cart/add']");
//     if (pf && pf.dataset.variantId) return pf.dataset.variantId;

//     return null;
//   }

//   // Safe one-time observer: wait for product form / variant input to appear
//   function waitForVariantElement(callback, timeout = 5000) {
//     const found = document.querySelector("[name='id']") || document.querySelector("form[action*='/cart/add']");
//     if (found) return callback(found);

//     const bodyObserver = new MutationObserver((mutations, obs) => {
//       const el = document.querySelector("[name='id']") || document.querySelector("form[action*='/cart/add']");
//       if (el) {
//         obs.disconnect();
//         callback(el);
//       }
//     });

//     bodyObserver.observe(document.body, { childList: true, subtree: true });

//     // Safety: auto-disconnect after timeout
//     setTimeout(() => {
//       try { bodyObserver.disconnect(); } catch (e) {}
//     }, timeout);
//   }

//   // Attach all listeners (safe, non-spammy)
//   function attachListenersOnce() {
//     captureOriginalButtonText();

//     // 1) If theme dispatches variant:change, use it (most 2.0 themes)
//     document.addEventListener("variant:change", (e) => {
//       const variant = e?.detail?.variant;
//       if (variant?.id) updatePreorderButton(String(variant.id));
//     });

//     // 2) Listen for native select change (if present)
//     document.addEventListener("change", (e) => {
//       const t = e.target;
//       if (!t) return;
//       // select[name="id"] or radio id
//       if ((t.matches && t.matches("[name='id']")) || (t.name === "id")) {
//         const val = t.value;
//         if (val) updatePreorderButton(val);
//       }
//     }, { passive: true });

//     // 3) Delegated click for themes that toggle variants via buttons (data-variant-id attr)
//     // When user clicks an option/button that has data-variant-id, update accordingly.
//     document.addEventListener("click", (e) => {
//       const el = e.target.closest && e.target.closest("[data-variant-id]");
//       if (el && el.dataset.variantId) {
//         // slight delay to allow theme to update DOM if needed
//         setTimeout(() => updatePreorderButton(el.dataset.variantId), 50);
//       }
//     }, { passive: true });

//     // 4) Observe product form for replacement of [name='id']; debounced to avoid storms
//     waitForVariantElement((el) => {
//       // use form as observation root if possible
//       const root = el.closest("form") || document.body;
//       let last = null;
//       const safe = debounce(() => {
//         const current = readCurrentVariantId();
//         if (current && current !== last) {
//           last = current;
//           updatePreorderButton(current);
//         }
//       }, 150);

//       // Fire initially if possible
//       const initial = readCurrentVariantId();
//       if (initial) updatePreorderButton(initial);

//       const obs = new MutationObserver(safe);
//       obs.observe(root, { childList: true, subtree: true });

//       // disconnect after a while to avoid forever-observing (keeps page light)
//       setTimeout(() => {
//         try { obs.disconnect(); } catch (e) {}
//       }, 20000); // 20s should be enough to catch dynamic replacements like quick view
//     }, 6000);
//   }

//   // Click handler for preorder buttons (unchanged except a small fix for remainingUnits)
//   function attachPreorderClickHandlers() {
//     captureOriginalButtonText();
//     preorderButtons().forEach((btn) => {
//       const sellingPlanData = document.getElementById("selling-plan-data");
//       if (!sellingPlanData) return;

//       // Avoid adding duplicate handlers
//       if (btn.dataset._handlerAttached === "true") return;
//       btn.dataset._handlerAttached = "true";

//       btn.addEventListener("click", async (ev) => {
//         ev.preventDefault();
//         const variantId = btn.dataset.variantId || readCurrentVariantId();
//         const sellingPlanId = sellingPlanData.dataset.sellingPlan;
//         const textEl = btn.querySelector(".button-text");
//         const quantityInput = document.querySelector('input[name="quantity"]');
//         const quantity = parseInt(quantityInput?.value || "1", 10);
//         const maxUnits = parseInt(btn.dataset.maxUnits || "0", 10);
//         const unitsSold = parseInt(btn.dataset.unitsSold || "0", 10);
//         const remainingUnits = Math.max(0, maxUnits - unitsSold);
//         const quantityError = document.getElementById("quantity-error");

//         if (textEl) textEl.textContent = "Adding to cart...";
//         btn.disabled = true;

//         if (quantity > remainingUnits) {
//           if (quantityError) quantityError.textContent = `You can only preorder up to ${remainingUnits} units for this product.`;
//           if (textEl) textEl.textContent = btn.dataset.originalText || "Pre-order";
//           btn.disabled = false;
//           return;
//         }

//         try {
//           const res = await fetch("/cart/add.js", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Accept: "application/json",
//             },
//             body: JSON.stringify({
//               items: [{
//                 id: variantId,
//                 quantity,
//                 selling_plan: sellingPlanId,
//               }],
//             }),
//           });

//           const data = await res.json();
//           console.log("Added to cart:", data);
//           window.location.href = "/cart";
//         } catch (err) {
//           console.error("Error adding to cart:", err);
//           if (textEl) textEl.textContent = btn.dataset.originalText || "Pre-order";
//           btn.disabled = false;
//         }
//       });
//     });
//   }

//   // Kickoff (attach once)
//   attachListenersOnce();
//   attachPreorderClickHandlers();

//   // Also re-run attaching handlers when new preorder buttons appear (dynamic blocks)
//   // One-shot body observer to detect if .preorder-button is added later (useful for AJAX quick view)
//   (function watchForPreorderButtons() {
//     if (document.querySelector(".preorder-button")) return;
//     const ob = new MutationObserver((mutations, observer) => {
//       if (document.querySelector(".preorder-button")) {
//         observer.disconnect();
//         // small delay to let DOM settle
//         setTimeout(() => {
//           captureOriginalButtonText();
//           attachListenersOnce();
//           attachPreorderClickHandlers();
//         }, 60);
//       }
//     });
//     ob.observe(document.body, { childList: true, subtree: true });
//     // safety disconnect
//     setTimeout(() => {
//       try { ob.disconnect(); } catch (e) {}
//     }, 8000);
//   })();
// });
