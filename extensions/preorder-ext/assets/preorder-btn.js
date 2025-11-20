document.addEventListener("DOMContentLoaded", function () {
  /* ---------------------------------------
     UNIVERSAL VARIANT DETECTOR
  --------------------------------------- */
  function getCurrentVariantId() {
    const select = document.querySelector("select[name='id']");
    if (select && select.value) return select.value;

    const checked = document.querySelector("input[name='id']:checked");
    if (checked) return checked.value;

    const hidden = document.querySelector("input[name='id'][type='hidden']");
    if (hidden && hidden.value) return hidden.value;

    return null;
  }

  /* ---------------------------------------
     UNIVERSAL BUTTON DETECTORS
  --------------------------------------- */
  function getAddToCartButton() {
    return (
      document.querySelector("form[action*='/cart/add'] button[type='submit']") ||
      document.querySelector(".product-form__submit") ||
      document.querySelector("button[name='add']") ||
      document.querySelector("product-form button")
    );
  }

  function getBuyNowButton() {
    return (
      document.querySelector("shopify-buy-it-now-button button") ||
      document.querySelector(".shopify-payment-button__button") ||
      document.querySelector("shopify-payment-button button")
    );
  }

  /* ---------------------------------------
     CAMPAIGN DATA
  --------------------------------------- */
  const campaignData = document.getElementById("campaign-data");
  const enumToIntMap = {
    OUT_OF_STOCK: 1,
    ALWAYS: 2,
    IN_STOCK: 3,
  };

  const campaignType =
    campaignData?.dataset?.campaignType
      ? enumToIntMap[campaignData.dataset.campaignType] || 2
      : 2;

  const preorderButtons = document.querySelectorAll(".preorder-button");

  preorderButtons.forEach((btn) => {
    const textEl = btn.querySelector(".button-text");
    if (textEl) btn.dataset.originalText = textEl.textContent;
  });

  function updatePreorderButton(variantId) {
    let showPreorderBtn = false;

    preorderButtons.forEach((btn) => {
      if (btn.dataset.variantId !== variantId) {
        btn.style.display = "none";
        return;
      }

      const isPreorder = btn.dataset.preorder == "true";
      const maxUnits = parseInt(btn.dataset.maxUnits || "0", 10);
      const unitsSold = parseInt(btn.dataset.unitsSold || "0", 10);

      const remaining = maxUnits - unitsSold;
      const inStock = remaining > 0;

      const isVariantAvailable = btn.dataset.instock === "true";

      let shouldShow = false;

      // Campaign Logic
      if (campaignType === 1 && !isVariantAvailable && inStock) shouldShow = true;
      else if (campaignType === 2) shouldShow = true;
      else if (campaignType === 3 ) shouldShow = true;

      if (isPreorder && shouldShow) {
        btn.style.display = "flex";
        showPreorderBtn = true;

        const textEl = btn.querySelector(".button-text");

        if (!inStock) {
          btn.style.opacity = "0.5";
          btn.style.pointerEvents = "none";
          if (textEl) textEl.textContent = "Sold Out";
        } else {
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
          if (textEl) textEl.textContent = btn.dataset.originalText;
        }
      } else {
        btn.style.display = "none";
      }
    });

    const buyNowBtn = getBuyNowButton();
    const addToCartBtn = getAddToCartButton();

    if (showPreorderBtn) {
      if (buyNowBtn) buyNowBtn.style.display = "none";
      if (addToCartBtn) addToCartBtn.style.display = "none";
    } else {
      if (buyNowBtn) buyNowBtn.style.display = "";
      if (addToCartBtn) addToCartBtn.style.display = "";
    }
  }

  function handleVariantChange() {
    const variantId = getCurrentVariantId();
    if (variantId) updatePreorderButton(variantId);
  }

  document.addEventListener("change", (e) => {
    if (e.target.name === "id") handleVariantChange();
  });

  let observerLock = false;
  let observerTimer = null;

  const observer = new MutationObserver(() => {
    if (observerLock) return;

    clearTimeout(observerTimer);
    observerTimer = setTimeout(() => {
      observerLock = true;

      handleVariantChange();

      setTimeout(() => {
        observerLock = false;
      }, 120);
    }, 60);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  handleVariantChange();

  preorderButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sellingPlanData = document.getElementById("selling-plan-data");
      if (!sellingPlanData) return;

      const textEl = btn.querySelector(".button-text");
      const variantId = btn.dataset.variantId;
      const sellingPlanId = sellingPlanData.dataset.sellingPlan;

      const quantityInput = document.querySelector('input[name="quantity"]');
      const quantity = parseInt(quantityInput?.value || "1", 10);

      const maxUnits = parseInt(btn.dataset.maxUnits || "0", 10);
      const unitsSold = parseInt(btn.dataset.unitsSold || "0", 10);
      const remaining = maxUnits - unitsSold;

      const quantityError = document.getElementById("quantity-error");
      if (quantityError) quantityError.textContent = "";

      if (quantity > remaining) {
        if (quantityError)
          quantityError.textContent = `You can only preorder ${remaining} units.`;
        return;
      }

      const loader = btn.querySelector(".loader-spinner");
      btn.disabled = true;
      if (textEl) textEl.style.opacity = "0.0";
      if (loader) {
        loader.style.display = "inline-block"; 
        loader.style.textAlign = "center";
      }

      try {
        await fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                id: variantId,
                quantity,
                selling_plan: sellingPlanId,
                properties: {
                  _campaignId: btn.dataset.campaignId,
                },
              },
            ],
          }),
        });

        window.location.href = "/cart";
      } catch (err) {
        console.error("Error adding to cart:", err);
        btn.disabled = false;
        if (textEl) textEl.style.opacity = "1";
        if (loader) loader.style.display = "none";
        textEl.textContent = btn.dataset.originalText;
      }
    });
  });
});
