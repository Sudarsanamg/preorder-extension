document.addEventListener("DOMContentLoaded", () => {

  const productForm = document.querySelector("form[action*='/cart/add']");
  const variantSelector = productForm?.querySelector("[name='id']");

  if (!productForm || !variantSelector) return;

  const enumToIntMap = {
    OUT_OF_STOCK: 1,
    ALWAYS: 2,
    IN_STOCK: 3,
  };

  const campaignDataEl = document.getElementById("campaign-data");
  const campaignType = enumToIntMap[
    campaignDataEl?.dataset?.campaignType
  ] || null;

  function replaceThemePrices() {
    document.querySelectorAll(
      ".price, .product__price, .product-price, price-element, [data-product-price]"
    ).forEach((el) => {
      if (!el.classList.contains("preorder-wrapper")) {
        el.style.display = "none";
        el.insertAdjacentHTML(
          "afterend",
          `<div class="preorder-wrapper"><span class="preorder-price"></span></div>`
        );
      }
    });
  }

  function hideAll() {
    document.querySelectorAll(".variant-price").forEach((el) => {
      el.style.display = "none";
    });
  }


  function resolveVariantBlock(variantId) {
    let block =
      document.getElementById(`variant-${variantId}`) ||
      document.querySelector(`[id="variant-${Number(variantId)}"]`) ||
      [...document.querySelectorAll(".variant-price")].find((el) =>
        el.id.includes(variantId)
      );

    return block;
  }


  function updatePrice(variantId) {
    hideAll();

    const block = resolveVariantBlock(variantId);
    if (!block) return;

    const inStock = block.dataset.instock == "true";

    let showCampaignPrice = false;


    if (campaignType) {
      if (campaignType === 1 && !inStock) showCampaignPrice = true;   
      else if (campaignType === 2) showCampaignPrice = true;          
      else if (campaignType === 3 ) showCampaignPrice = true; 
    }


    let html = "";

    if (showCampaignPrice) {
      const sp = block.querySelector(".sp-price");
      const spCmp = block.querySelector(".sp-compare");

      if (sp) {
        html += sp.outerHTML;
        if (spCmp) html += spCmp.outerHTML;
      } else {
        const fallback = block.querySelector(".fallback-price");
        html += `<span style="font-size: large;">${fallback.textContent.trim()}</span>`;
      }
    }

    else {
      const fallback = block.querySelector(".fallback-price");
      const fallbackCmp = block.querySelector(".fallback-compare");

      if (fallback) {
        html += `<span style="font-size: large;">${fallback.textContent.trim()}</span>`;
      }
      if (fallbackCmp) {
        html += fallbackCmp.outerHTML;
      }
    }


    document.querySelectorAll(".preorder-price").forEach((node) => {
      node.innerHTML = html;
    });

    block.style.display = "block";
  }

  replaceThemePrices();
  updatePrice(variantSelector.value);

  variantSelector.addEventListener("change", (e) => {
    updatePrice(e.target.value);
  });
});
