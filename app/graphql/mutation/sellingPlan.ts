export const CREATE_SELLING_PLAN_BASE = (
  paymentMode: "partial" | "full",
  discountType: "none" | "percentage" | "flat"
) => {
  const isPartial = paymentMode === "partial";

  // Billing policy differs slightly
  const billingPolicy = isPartial
    ? `checkoutCharge: { type: PERCENTAGE, value: { percentage: $percentage } }
       remainingBalanceChargeTrigger: TIME_AFTER_CHECKOUT
       remainingBalanceChargeTimeAfterCheckout: $days`
    : `checkoutCharge: { type: PERCENTAGE, value: { percentage: 100 } }
       remainingBalanceChargeTrigger: NO_REMAINING_BALANCE`;

  // Pricing policies differ based on discount type
  let pricingPolicies = "";
  if (discountType === "percentage") {
    pricingPolicies = `
      pricingPolicies: [
        {
          fixed: {
            adjustmentType: PERCENTAGE
            adjustmentValue: { percentage: $discountPercentage }
          }
        }
      ]`;
  } else if (discountType === "flat") {
    pricingPolicies = `
      pricingPolicies: [
        {
          fixed: {
            adjustmentType: FIXED_AMOUNT
            adjustmentValue: { amount: $fixedValue }
          }
        }
      ]`;
  }

  return `#graphql
    mutation CreateSellingPlan(
      $variantIds: [ID!]!
      ${isPartial ? "$percentage: Float!, $days: String!" : ""}
      ${discountType === "percentage" ? "$discountPercentage: Float!" : ""}
      ${discountType === "flat" ? "$fixedValue: Decimal!" : ""}
    ) {
      sellingPlanGroupCreate(
        input: {
          name: "${isPartial ? "Deposit Pre-order" : "Full Payment Pre-order"}"
          merchantCode: "${isPartial ? "pre-order-deposit" : "pre-order-full"}"
          options: ["Pre-order"]
          sellingPlansToCreate: [
            {
              name: "${isPartial ? "Deposit, balance later" : "Pay full upfront"}"
              category: PRE_ORDER
              options: ["${isPartial ? "Deposit, balance later" : "Full payment"}"]
              billingPolicy: { fixed: { ${billingPolicy} } }
              deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
              inventoryPolicy: { reserve: ON_FULFILLMENT }
              ${pricingPolicies}
            }
          ]
        }
        resources: { productVariantIds: $variantIds }
      ) {
        sellingPlanGroup {
          id
          sellingPlans(first: 1) {
            edges {
              node { id }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;
};
