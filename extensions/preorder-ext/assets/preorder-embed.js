document.addEventListener("DOMContentLoaded", () => {
  const embed = document.getElementById("app-preorder-embed");
  if (!embed) return;

  // Find the main product form
  const form = document.querySelector("product-form form[action*='/cart/add'], form[action*='/cart/add']");
  if (!form) return;

  // Try to find the Buy/Add button inside that form
  const buyButton = form.querySelector("button[name='add'], button[type='submit']");

  if (buyButton) {
    // Insert embed right before the Buy button
    buyButton.insertAdjacentElement("beforebegin", embed);
  } else {
    // Fallback: just place after the form if no button found
    form.insertAdjacentElement("afterend", embed);
  }

  // Finally, show the embed
  embed.style.display = "block";
});
