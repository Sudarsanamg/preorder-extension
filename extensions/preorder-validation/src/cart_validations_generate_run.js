export function cartValidationsGenerateRun(input) {
  const errors = [];

  const lines = input.cart?.lines ?? [];

  lines.forEach((line, index) => {
    const variant = line.merchandise;

    if (!variant || variant.__typename !== "ProductVariant") return;


    const maxMeta = parseInt(variant.preorderMax?.value || "0", 10);
    const unitsSold = parseInt(variant.preorderSold?.value || "0", 10);
    
if (maxMeta > 0) {
  const availableUnits = maxMeta - unitsSold;
  const q = line.quantity ?? 0;

  if (q > availableUnits) {
    errors.push({
      message: `Sorry!,Only ${availableUnits} unit(s) available for this variant..`,
      target: `$.cart.lines[${index}].quantity`,
    });
  }
}
  });


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
