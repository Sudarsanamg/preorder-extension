import type { DiscountType } from "@prisma/client";
export const CREATE_SELLING_PLAN_BASE = (
  paymentMode: "partial" | "full",
  fulfillmentMode: "ONHOLD" | "UNFULFILED" | "SCHEDULED" = "UNFULFILED",
  collectionMode: "DAYS_AFTER" | "EXACT_DATE" = "DAYS_AFTER",
  formData: FormData,

) => {
  const isPartial = paymentMode === "partial";
  const isScheduledFulfillment = fulfillmentMode === "SCHEDULED";
  const isExactDateCollection = collectionMode === "EXACT_DATE";
  const discountType = formData.get("discountType") as DiscountType;
  const discountValue = Number(formData.get("discountValue")) || 0;

  let billingFixedFields;
  if (isPartial) {
    billingFixedFields = isExactDateCollection
      ? `checkoutCharge: { type: PERCENTAGE, value: { percentage: $percentage } }
         remainingBalanceChargeTrigger: EXACT_TIME
         remainingBalanceChargeExactTime: $exactDate`
      : `checkoutCharge: { type: PERCENTAGE, value: { percentage: $percentage } }
         remainingBalanceChargeTrigger: TIME_AFTER_CHECKOUT
         remainingBalanceChargeTimeAfterCheckout: $days`;
  } else {
    billingFixedFields = `checkoutCharge: { type: PERCENTAGE, value: { percentage: 100 } }
                     remainingBalanceChargeTrigger: NO_REMAINING_BALANCE`;
  }

  let deliveryPolicy = `deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }`;

  if (fulfillmentMode === "ONHOLD") {
    deliveryPolicy = `deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }`;
  } else if (fulfillmentMode === "UNFULFILED") {
    deliveryPolicy = `deliveryPolicy: { fixed: { fulfillmentTrigger: ASAP } }`;
  } else if (fulfillmentMode === "SCHEDULED") {
    deliveryPolicy = `deliveryPolicy: { fixed: { fulfillmentTrigger: EXACT_TIME, fulfillmentExactTime: $fulfillmentDate } }`;
  }

  let pricingPolicies = "";
  if (discountType === "PERCENTAGE") {
    pricingPolicies = `
      pricingPolicies: [
        {
          fixed: {
            adjustmentType: PERCENTAGE
            adjustmentValue: { percentage: ${discountValue} }
          }
        }
      ]`;
  } else if (discountType === "FIXED") {
    pricingPolicies = `
      pricingPolicies: [
        {
          fixed: {
            adjustmentType: FIXED_AMOUNT
            adjustmentValue: { amount: ${discountValue} }
          }
        }
      ]`;
  }
  const variableDeclarations = [
    "$variantIds: [ID!]!",
    isPartial ? "$percentage: Float!" : "",
    isPartial && !isExactDateCollection ? "$days: String!" : "",
    isPartial && isExactDateCollection ? "$exactDate: DateTime!" : "",
    isScheduledFulfillment ? "$fulfillmentDate: DateTime!" : "",
  ]
    .filter(Boolean)
    .join(", ");

  const paramList = variableDeclarations.trim().length > 0 ? `(${variableDeclarations})` : "";
  const billingPolicyBlock = `billingPolicy: { fixed: { ${billingFixedFields} } }`;

  return `
    mutation CreateSellingPlan${paramList} {
      sellingPlanGroupCreate(
        input: {
          name: "${isPartial ? `${formData.get('partialPaymentText')}` : `${formData.get('fullPaymentText')}` }"
          merchantCode: "${isPartial ? "pre-order-deposit" : "pre-order-full"}"
          options: ["Pre-order"]
          sellingPlansToCreate: [
            {
              name: "${isPartial ?  formData.get('partialPaymentText') :  formData.get('fullPaymentText')}"
              category: PRE_ORDER
              options: ["${isPartial ? "Deposit, balance later" : "Full payment"}"]
              ${billingPolicyBlock}
              ${deliveryPolicy}
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


// export const CREATE_SELLING_PLAN_BASE = (
//   paymentMode: "partial" | "full",
// ) => {
//   const isPartial = paymentMode === "partial";

//   // Billing policy differs slightly
//   const billingPolicy = isPartial
//     ? `checkoutCharge: { type: PERCENTAGE, value: { percentage: $percentage } }
//        remainingBalanceChargeTrigger: TIME_AFTER_CHECKOUT
//        remainingBalanceChargeTimeAfterCheckout: $days`
//     : `checkoutCharge: { type: PERCENTAGE, value: { percentage: 100 } }
//        remainingBalanceChargeTrigger: NO_REMAINING_BALANCE`;

//   // Pricing policies differ based on discount type
//   let pricingPolicies = "";
//   // if (discountType === "percentage") {
//   //   pricingPolicies = `
//   //     pricingPolicies: [
//   //       {
//   //         fixed: {
//   //           adjustmentType: PERCENTAGE
//   //           adjustmentValue: { percentage: $discountPercentage }
//   //         }
//   //       }
//   //     ]`;
//   // } else if (discountType === "flat") {
//   //   pricingPolicies = `
//   //     pricingPolicies: [
//   //       {
//   //         fixed: {
//   //           adjustmentType: FIXED_AMOUNT
//   //           adjustmentValue: { amount: $fixedValue }
//   //         }
//   //       }
//   //     ]`;
//   // }

//   return `#graphql
//     mutation CreateSellingPlan(
//       $variantIds: [ID!]!
//       ${isPartial ? "$percentage: Float!, $days: String!" : ""}
//     ) {
//       sellingPlanGroupCreate(
//         input: {
//           name: "${isPartial ? "Deposit Pre-order" : "Full Payment Pre-order"}"
//           merchantCode: "${isPartial ? "pre-order-deposit" : "pre-order-full"}"
//           options: ["Pre-order"]
//           sellingPlansToCreate: [
//             {
//               name: "${isPartial ? "Deposit, balance later" : "Pay full upfront"}"
//               category: PRE_ORDER
//               options: ["${isPartial ? "Deposit, balance later" : "Full payment"}"]
//               billingPolicy: { fixed: { ${billingPolicy} } }
//               deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
//               inventoryPolicy: { reserve: ON_FULFILLMENT }
//               ${pricingPolicies}
//             }
//           ]
//         }
//         resources: { productVariantIds: $variantIds }
//       ) {
//         sellingPlanGroup {
//           id
//           sellingPlans(first: 1) {
//             edges {
//               node { id }
//             }
//           }
//         }
//         userErrors { field message }
//       }
//     }
//   `;
// };

export const GET_VARIANT_SELLING_PLANS = `
  query GetVariantSellingPlans($id: ID!) {
    productVariant(id: $id) {
      id
      sellingPlanGroups(first: 10) {
        edges {
          node {
            id
            name
            merchantCode
          }
        }
      }
    }
  }
`;

export const removeVariantMutation = `
        mutation RemoveVariantFromGroup($groupId: ID!, $variantIds: [ID!]!) {
          sellingPlanGroupRemoveProductVariants(
            id: $groupId
            productVariantIds: $variantIds
          ) {
            userErrors {
              field
              message
            }
          }
        }
      `;

export const DELETE_SELLING_PLAN_GROUP = `
  mutation DeleteSellingPlanGroup($id: ID!) {
    sellingPlanGroupDelete(id: $id) {
      deletedSellingPlanGroupId
      userErrors {
        field
        message
      }
    }
  }
`;



// export const CREATE_SELLING_PLAN_BASE = (
//   paymentMode: "partial" | "full",
//   discountType: "none" | "percentage" | "flat"
// ) => {
//   const isPartial = paymentMode === "partial";

//   // Billing policy differs slightly
//   const billingPolicy = isPartial
//     ? `checkoutCharge: { type: PERCENTAGE, value: { percentage: $percentage } }
//        remainingBalanceChargeTrigger: TIME_AFTER_CHECKOUT
//        remainingBalanceChargeTimeAfterCheckout: $days`
//     : `checkoutCharge: { type: PERCENTAGE, value: { percentage: 100 } }
//        remainingBalanceChargeTrigger: NO_REMAINING_BALANCE`;

//   // Pricing policies differ based on discount type
//   let pricingPolicies = "";
//   if (discountType === "percentage") {
//     pricingPolicies = `
//       pricingPolicies: [
//         {
//           fixed: {
//             adjustmentType: PERCENTAGE
//             adjustmentValue: { percentage: $discountPercentage }
//           }
//         }
//       ]`;
//   } else if (discountType === "flat") {
//     pricingPolicies = `
//       pricingPolicies: [
//         {
//           fixed: {
//             adjustmentType: FIXED_AMOUNT
//             adjustmentValue: { amount: $fixedValue }
//           }
//         }
//       ]`;
//   }

//   return `#graphql
//     mutation CreateSellingPlan(
//       $variantIds: [ID!]!
//       ${isPartial ? "$percentage: Float!, $days: String!" : ""}
//       ${discountType === "percentage" ? "$discountPercentage: Float!" : ""}
//       ${discountType === "flat" ? "$fixedValue: Decimal!" : ""}
//     ) {
//       sellingPlanGroupCreate(
//         input: {
//           name: "${isPartial ? "Deposit Pre-order" : "Full Payment Pre-order"}"
//           merchantCode: "${isPartial ? "pre-order-deposit" : "pre-order-full"}"
//           options: ["Pre-order"]
//           sellingPlansToCreate: [
//             {
//               name: "${isPartial ? "Deposit, balance later" : "Pay full upfront"}"
//               category: PRE_ORDER
//               options: ["${isPartial ? "Deposit, balance later" : "Full payment"}"]
//               billingPolicy: { fixed: { ${billingPolicy} } }
//               deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
//               inventoryPolicy: { reserve: ON_FULFILLMENT }
//               ${pricingPolicies}
//             }
//           ]
//         }
//         resources: { productVariantIds: $variantIds }
//       ) {
//         sellingPlanGroup {
//           id
//           sellingPlans(first: 1) {
//             edges {
//               node { id }
//             }
//           }
//         }
//         userErrors { field message }
//       }
//     }
//   `;
// };

export async function allowOutOfStockForVariants(admin:any,products: any[]) {
  if (!products?.length) {
    console.warn("⚠️ No products provided to allowOutOfStockForProducts");
    return;
  }

  // 🧩 Group variants by product ID
  const grouped: Record<string, string[]> = {};
  for (const p of products as any[]) {
    if (!p.productId || !p.variantId) continue;
    if (!grouped[p.productId]) grouped[p.productId] = [];
    grouped[p.productId].push(p.variantId);
  }

  const mutation = `
    mutation updateVariants($id: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $id, variants: $variants) {
        productVariants {
          id
          inventoryPolicy
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // 🧠 Loop each product (1 mutation per product)
  for (const [productId, variantIds] of Object.entries(grouped)) {
    const variables = {
      id: productId,
      variants: variantIds.map((variantId) => ({
        id: variantId,
        inventoryPolicy: "CONTINUE",
      })),
    };

    try {
      const response = await admin.graphql(mutation, { variables });
      const result = await response.json();
      const data = result.data?.productVariantsBulkUpdate;

      if (data?.userErrors?.length) {
        console.error(`❌ Errors for product ${productId}:`, data.userErrors);
      } else {
        console.log(
          `✅ Updated ${variantIds.length} variant(s) for product ${productId}`
        );
      }
    } catch (error) {
      console.error(`⚠️ Failed to update product ${productId}:`, error);
    }
  }
}

export async function revertOutOfStockForVariants(admin: any, products: string[]) {
  if (!products?.length) {
    console.warn("⚠️ No products provided to revertOutOfStockForVariants");
    return;
  }

  // 🧩 Group variants by product ID
  const grouped: Record<string, string[]> = {};
  for (const p of products as any[]) {
    if (!p.productId || !p.variantId) continue;
    if (!grouped[p.productId]) grouped[p.productId] = [];
    grouped[p.productId].push(p.variantId);
  }

  const mutation = `
    mutation updateVariants($id: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $id, variants: $variants) {
        productVariants {
          id
          inventoryPolicy
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  for (const [productId, variantIds] of Object.entries(grouped)) {
    const variables = {
      id: productId,
      variants: variantIds.map((variantId) => ({
        id: variantId,
        inventoryPolicy: "DENY", // 👈 revert to not allowing out-of-stock
      })),
    };

    try {
      const response = await admin.graphql(mutation, { variables });
      const result = await response.json();
      const data = result.data?.productVariantsBulkUpdate;

      if (data?.userErrors?.length) {
        console.error(`❌ Errors for product ${productId}:`, data.userErrors);
      } else {
        console.log(
          `🔁 Reverted ${variantIds.length} variant(s) for product ${productId}`
        );
      }
    } catch (error) {
      console.error(`⚠️ Failed to revert product ${productId}:`, error);
    }
  }
}