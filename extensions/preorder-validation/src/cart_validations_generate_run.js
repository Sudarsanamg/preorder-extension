export function cartValidationsGenerateRun(input) {
  console.log("Cart Input:", JSON.stringify(input.cart, null, 2));
  const errors = [];

  const lines = input.cart?.lines ?? [];
  // console.log("Cart lines:", lines.length);

  lines.forEach((line, index) => {
    const variant = line.merchandise;
    // console.log("Variant at line", index, variant);

    if (!variant || variant.__typename !== "ProductVariant") return;
    // console.log(JSON.stringify(variant, null, 2));


    const maxMeta = parseInt(variant.preorderMax?.value || "0", 10);
    // console.log(maxMeta,'maxMeta');
    const unitsSold = parseInt(variant.preorderSold?.value || "0", 10);
    // console.log(unitsSold,'unitsSold');
    const availableUnits = maxMeta - unitsSold;
    // console.log(availableUnits,'availableUnits');

   // Only validate if maxMeta > 0
if (maxMeta > 0) {
  const availableUnits = maxMeta - unitsSold;
  const q = line.quantity ?? 0;

  if (q > availableUnits) {
    errors.push({
      message: `Only ${availableUnits} unit(s) available for this variant. Please reduce quantity.`,
      target: `$.cart.lines[${index}].quantity`,
    });
  }
}
  });

  console.log("Errors:", errors);

  return {
    operations: [
      {
        validationAdd: {
          errors,
        },
      },
    ],
  };
}
