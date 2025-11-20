
document.addEventListener("DOMContentLoaded", () => {
  const embed = document.getElementById("app-preorder-embed");
  if (!embed) return;

  const form = document.querySelector("product-form form[action*='/cart/add'], form[action*='/cart/add']");
  if (!form) return;

  const quantitySelectors = [
    "quantity-input",
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
    quantityEl.insertAdjacentElement("afterend", embed);
  } else {
    const fallbackBtn = form.querySelector("button[name='add'], button[type='submit']");
    if (fallbackBtn) fallbackBtn.insertAdjacentElement("beforebegin", embed);
    else form.insertAdjacentElement("afterend", embed);
  }

  embed.style.display = "block";
});
