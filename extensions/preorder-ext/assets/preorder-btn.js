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
  const campaignType = parseInt(campaignData?.dataset.campaignType, 10);
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

    const isPreorder = btn.dataset.preorder == "true";
    const maxUnits = parseInt(btn.dataset.maxUnits || "0", 10);
    const unitsSold = parseInt(btn.dataset.unitsSold || "0", 10);
    const inStock = unitsSold < maxUnits;
    // Apply campaign rules
    let showPreorder = false;
    if (campaignType === 1 && !inStock) showPreorder = true;
    else if (campaignType === 2) showPreorder = true;
    else if (campaignType === 3 && inStock) showPreorder = true;

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
