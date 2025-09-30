document.addEventListener("DOMContentLoaded", function () {
  // Shopify default buttons
  const buyNowBtn = document.querySelector("shopify-buy-it-now-button button");
  const addToCartBtn = document.querySelector(
    "form[action*='/cart/add'] [type='submit']",
  );

  // Product & campaign data
  const productData = document.getElementById("product-data");
  const isPreorderProduct = productData?.dataset.preorder === "true";
  const campaignData = document.getElementById("campaign-data");
  const campaignType = parseInt(campaignData?.dataset.campaignType, 10);
  const stockEl = document.getElementById("product-stock");
  const inStock = stockEl?.dataset.inStock === "true";
  const metaEl = document.getElementById("product-metafields");
  // Variant selection
  const variantSelect = document.querySelector("[name='id']");
  const preorderButtons = document.querySelectorAll(".preorder-button");

  // Show/hide the correct preorder button based on selected variant
  function updatePreorderButton(variantId) {
    let showingPreorder = false;

    preorderButtons.forEach((btn) => {
       
      const isPreorder = btn.dataset.preorder == "true";
      if (btn.dataset.variantId === variantId && isPreorder) {
        btn.style.display = "flex";

        // Check sold out
        const maxUnits = parseInt(btn.dataset.maxUnits || "0", 10);
       const unitsSold = parseInt(btn.dataset.unitsSold || "0", 10);
        if (unitsSold >= maxUnits) {
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

    if (showingPreorder) {
      if (buyNowBtn && addToCartBtn) {
        buyNowBtn.style.display = "none";
        addToCartBtn.style.display = "none";
      }
    } else {
      if (buyNowBtn && addToCartBtn) {
        buyNowBtn.style.display = "inline-block";
        addToCartBtn.style.display = "inline-block";
      }
    }
  }

  // Initial load
  if (variantSelect) {
    preorderButtons.forEach((btn) => {
      // Save original button text
      btn.dataset.originalText = btn.querySelector(".button-text").textContent;
    });

    updatePreorderButton(variantSelect.value);

    // On variant change
    variantSelect.addEventListener("change", (e) => {
      updatePreorderButton(e.target.value);
    });
  }

  // Functions to hide/disable normal buttons
  function hideNormalButtons() {
    if (buyNowBtn && addToCartBtn) {
      buyNowBtn.style.display = "none";
      addToCartBtn.style.display = "none";
    }
  }

  function hideAllPreorderButtons() {
    preorderButtons.forEach((btn) => (btn.style.display = "none"));
  }

  function disableNormalButtons() {
    if (buyNowBtn && addToCartBtn) {
      buyNowBtn.disabled = true;
      addToCartBtn.disabled = true;
    }
  }

  // Campaign logic
  if (campaignType === 1) {
    if (!inStock) hideNormalButtons();
    else hideAllPreorderButtons();
  } else if (campaignType === 2) {
    hideNormalButtons();
  } else if (campaignType === 3) {
    if (inStock) hideNormalButtons();
    else {
      disableNormalButtons();
      hideAllPreorderButtons();
    }
  }

  // Add to cart handler for all preorder buttons
  preorderButtons.forEach((btn) => {
    const sellingPlanData = document.getElementById("selling-plan-data");
    if (!sellingPlanData) return;

    btn.addEventListener("click", async () => {
      const variantId = btn.dataset.variantId;
      const sellingPlanId = sellingPlanData.dataset.sellingPlan;
      const textEl = btn.querySelector(".button-text");

      textEl.textContent = "Adding to cart...";
      btn.disabled = true;

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
                quantity: 1,
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
