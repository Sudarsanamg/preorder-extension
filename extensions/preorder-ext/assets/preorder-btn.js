document.addEventListener("DOMContentLoaded", function () {
  const buyNowBtn = document.querySelector("shopify-buy-it-now-button button");
  const addToCartBtn = document.querySelector("form[action*='/cart/add'] [type='submit']");
   const productData = document.getElementById("product-data");
  const isPreorder = productData?.dataset.preorder === "true";
  
  if (buyNowBtn && addToCartBtn && isPreorder) {
    buyNowBtn.style.display = "none";
    addToCartBtn.style.display = "none";
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
