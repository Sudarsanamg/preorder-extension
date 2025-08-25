document.addEventListener("DOMContentLoaded", function () {


  const buyNowBtn = document.querySelector("shopify-buy-it-now-button button");
  const addToCartBtn = document.querySelector("form[action*='/cart/add'] [type='submit']");

  if (buyNowBtn && addToCartBtn) {
        buyNowBtn.style.display = "none";
        addToCartBtn.style.display = "none";
  }

  const preorderBtn = document.querySelector(".preorder-button");
  if (preorderBtn) {

const variantId = preorderBtn.dataset.variantId;
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
            quantity: 1
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
