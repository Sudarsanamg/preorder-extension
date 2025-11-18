document.addEventListener("DOMContentLoaded", () => {
  const moneyFormat =
    window.theme?.moneyFormat ||
    window.Shopify?.money_format ||
    window.Shopify?.monetary_format;

  const formatMoney = amount => {
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(amount, moneyFormat);
    }

    // Fallback — cents to currency with two decimals
    return `$${(amount / 100).toFixed(2)}`;
  };

  const cards = document.querySelectorAll(
    "product-card, .card-wrapper, .grid__item"
  );

  cards.forEach(card => {
    const jsonScript = card.querySelector("script[type='application/json']");
    if (!jsonScript) return;

    let product;
    try {
      product = JSON.parse(jsonScript.textContent);
    } catch (e) {
      return;
    }

    const variantPrices = Array.isArray(product?.variants)
      ? product.variants
          .map(variant => Number(variant?.price))
          .filter(price => !Number.isNaN(price))
      : [];

    const basePrice =
      variantPrices.sort((a, b) => a - b)[0] ??
      Number(product?.price) ??
      Number(product?.price_min) ??
      null;

    if (!basePrice) return;

    let discountedPrice = null;

    const considerPrice = candidate => {
      if (candidate == null || Number.isNaN(candidate)) return;
      if (candidate <= 0) return;

      if (discountedPrice === null || candidate < discountedPrice) {
        discountedPrice = candidate;
      }
    };

    const priceFromAdjustment = (price, adjustment) => {
      if (!adjustment) return null;

      const { value_type: type, value } = adjustment;

      if (type === "percentage") {
        return Math.round(price - price * (value / 100));
      }

      if (type === "fixed_amount") {
        return Math.round(price - value);
      }

      if (type === "price") {
        return Math.round(value);
      }

      return null;
    };

    product?.selling_plan_groups?.forEach(group => {
      group?.selling_plans?.forEach(plan => {
        plan?.price_adjustments?.forEach(adj => {
          considerPrice(priceFromAdjustment(basePrice, adj));
        });
      });
    });

    if (discountedPrice === null || discountedPrice >= basePrice) return;

    const priceEl =
      card.querySelector("[data-price]") ||
      card.querySelector(".price-item--regular") ||
      card.querySelector(".price__regular, .price__sale, .price");

    if (!priceEl) return;

    priceEl.innerHTML = `
      <span style="text-decoration:line-through;opacity:0.6;margin-right:6px;">
        ${formatMoney(basePrice)}
      </span>
      <span style="font-weight:600;color:#d12;">
        ${formatMoney(discountedPrice)}
      </span>
    `;
  });
});
