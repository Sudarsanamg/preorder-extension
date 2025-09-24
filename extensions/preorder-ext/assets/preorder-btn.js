document.addEventListener("DOMContentLoaded", function () {
  const buyNowBtn = document.querySelector("shopify-buy-it-now-button button");
  const addToCartBtn = document.querySelector("form[action*='/cart/add'] [type='submit']");
  const productData = document.getElementById("product-data");
  const isPreorder = productData?.dataset.preorder === "true";
  const campaignData = document.getElementById("campaign-data");
  const campaignType = parseInt(campaignData?.dataset.campaignType, 10);

  const stockEl = document.getElementById("product-stock");
  const inStock = stockEl?.dataset.inStock === "true";

  const metaEl = document.getElementById("product-metafields");
  const maxUnits = parseInt(metaEl.dataset.maxUnits, 10);
  const unitsSold = parseInt(metaEl.dataset.unitsSold, 10);

  if (unitsSold >= maxUnits ) {
    const preorderBtn = document.querySelector(".preorder-button");
    if (preorderBtn) {
      preorderBtn.style.opacity = "0.5";
      preorderBtn.style.pointerEvents = "none";
      preorderBtn.querySelector(".button-text").textContent = "Sold Out";
    }
  }

  function hideNormalButtons(){
    if (buyNowBtn && addToCartBtn) {
      buyNowBtn.style.display = "none";
      addToCartBtn.style.display = "none";
    }
  }

  function hidePreorderButton(){
    const preorderBtn = document.querySelector(".preorder-button");
    if (preorderBtn) {
      preorderBtn.style.display = "none";
    }
  }

  function disableNormalButtons(){
    if (buyNowBtn && addToCartBtn) {
      buyNowBtn.disabled = true;
      addToCartBtn.disabled = true;
    }
  }

  if (campaignType === 1) {
    if (!inStock) hideNormalButtons();
    else hidePreorderButton();
  } else if (campaignType === 2) {
    hideNormalButtons();
  } else if (campaignType === 3) {
    if (inStock) hideNormalButtons();
    else {
      disableNormalButtons();
      hidePreorderButton();
    }
  }

  const preorderBtn = document.querySelector(".preorder-button");
  const sellingPlanData = document.getElementById("selling-plan-data");

  if (preorderBtn && sellingPlanData) {
    const variantId = preorderBtn.dataset.variantId;
    const sellingPlanId = sellingPlanData.dataset.sellingPlan; 

    preorderBtn.addEventListener("click", async () => {
      const textEl = preorderBtn.querySelector(".button-text");
      textEl.innerHTML = "Adding to cart...";
      try {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            items: [
              {
                id: variantId,
                quantity: 1,
                selling_plan: sellingPlanId
              }
            ]
          })
        });

        const data = await res.json();
        console.log("Added to cart:", data);
        window.location.href = "/cart";

      } catch (err) {
        console.error("Error adding to cart:", err);
      }
    });
  }
});
