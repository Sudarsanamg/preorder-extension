document.addEventListener("DOMContentLoaded", function () {
  const buyNowBtn = document.querySelector("shopify-buy-it-now-button button");
  const addToCartBtn = document.querySelector("form[action*='/cart/add'] [type='submit']");
   const productData = document.getElementById("product-data");
  const isPreorder = productData?.dataset.preorder === "true";
  const campaignData = document.getElementById("campaign-data");
  const campaignType = parseInt(campaignData?.dataset.campaignType, 10);

    // Replace this with the actual value, e.g. from a data attribute or server-rendered variable
const stockEl = document.getElementById("product-stock");
const inStock = stockEl?.dataset.inStock === "true";

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
    // Preorder only if OUT OF STOCK
    if (!inStock) {
      hideNormalButtons();

    } else {
      hidePreorderButton();

    }
  } else if (campaignType === 2) {
    // Always Preorder
    hideNormalButtons();
  } else if (campaignType === 3) {
    // Preorder only if IN STOCK
    if (inStock) {
      hideNormalButtons();
      
    } else {
      disableNormalButtons();
      hidePreorderButton();

    }
  }

    
  const preorderBtn = document.querySelector(".preorder-button");
  const sellingPlanData = document.getElementById("selling-plan-data");

  if (preorderBtn && sellingPlanData) {
    const variantId = preorderBtn.dataset.variantId;
    const sellingPlanId = sellingPlanData.dataset.sellingPlan; 
    preorderBtn.addEventListener("click", () => {
      fetch("/cart/add.js", {
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
              selling_plan: sellingPlanId   // ✅ pass only the ID string
            }
          ]
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log("Added to cart:", data);
        window.location.href = "/cart";
      })
      .catch(err => console.error("Error adding to cart:", err));
    });
  }
});
