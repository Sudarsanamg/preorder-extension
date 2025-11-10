// document.addEventListener("DOMContentLoaded", () => {
//   const embed = document.getElementById("app-preorder-embed");
//   if (!embed) return;

//   // Find the main product form
//   const form = document.querySelector("product-form form[action*='/cart/add'], form[action*='/cart/add']");
//   if (!form) return;

//   // Try to find the Buy/Add button inside that form
//   const buyButton = form.querySelector("button[name='add'], button[type='submit']");

//   if (buyButton) {
//     // Insert embed right before the Buy button
//     buyButton.insertAdjacentElement("beforebegin", embed);
//   } else {
//     // Fallback: just place after the form if no button found
//     form.insertAdjacentElement("afterend", embed);
//   }

//   // Finally, show the embed
//   embed.style.display = "block";
// });



document.addEventListener("DOMContentLoaded", () => {
  const embed = document.getElementById("app-preorder-embed");
  if (!embed) return;

  // Find the main product form
  const form = document.querySelector("product-form form[action*='/cart/add'], form[action*='/cart/add']");
  if (!form) return;

  // 🧩 Try to locate the quantity selector (universal selectors)
  const quantitySelectors = [
    "quantity-input", // Shopify’s web component <quantity-input>
    ".quantity__input",
    ".product-form__input--quantity",
    "input[name='quantity']",
    ".product-quantity",
    ".quantity-selector",
  ];

  let quantityEl = null;
  for (const sel of quantitySelectors) {
    const found = form.querySelector(sel);
    if (found) {
      quantityEl = found.closest("div, quantity-input, fieldset") || found;
      break;
    }
  }

  if (quantityEl) {
    // ✅ Insert your embed right after the quantity section
    quantityEl.insertAdjacentElement("afterend", embed);
  } else {
    // ⚙️ Fallback: place after the Add to Cart button
    const fallbackBtn = form.querySelector("button[name='add'], button[type='submit']");
    if (fallbackBtn) fallbackBtn.insertAdjacentElement("beforebegin", embed);
    else form.insertAdjacentElement("afterend", embed);
  }

  // Finally, show the embed
  embed.style.display = "block";
});
