// import { CREATE_SELLING_PLAN_BASE} from "../graphql/mutation/sellingPlan";

// type PaymentMode = "partial" | "full";
// type FulfillmentMode = "ONHOLD" | "UNFULFILED" | "SCHEDULED";
// type CollectionMode = "DAYS_AFTER" | "EXACT_DATE";

// // export async function createSellingPlan(admin: any, paymentMode: "partial" | "full", products: any[], formData: FormData, customDays?: number | 7) {
// //   const variantIds = products.map((p) => p.variantId);
// //   const mutation = CREATE_SELLING_PLAN_BASE(paymentMode);

// //   let variables: Record<string, any> = { variantIds };

// //   if (paymentMode === "partial") {
// //     variables.percentage = Number(formData.get("depositPercent"));
// //     variables.days = `P7D`;
// //   }


// //   const response = await admin.graphql(mutation, { variables });
// //   return response.json();
// // }


// export async function createSellingPlan(
//   admin: any,
//   paymentMode: PaymentMode,
//   products: any[],
//   formData: FormData,
//   {
//     fulfillmentMode = "UNFULFILED",
//     collectionMode = "DAYS_AFTER",
//     customDays = 7,
//     balanceDueDate, 
//     fulfillmentDate, 
//   }: {
//     fulfillmentMode?: FulfillmentMode;
//     collectionMode?: CollectionMode;
//     customDays?: number;
//     balanceDueDate?: string | Date;
//     fulfillmentDate?: string | Date;
//   } = {}
// ) {

//   console.log("balanceDueDate", balanceDueDate);
//   console.log("fulfillmentDate", fulfillmentDate);
//   const variantIds = products.map((p) => p.variantId);
//   const mutation = CREATE_SELLING_PLAN_BASE(paymentMode, fulfillmentMode, collectionMode);

//   const variables: Record<string, any> = { variantIds };

//   if (paymentMode === "partial") {
//     variables.percentage = Number(formData.get("depositPercent"));

//     if (collectionMode === "DAYS_AFTER") {
//       variables.days = `P${customDays}D`;
//     } else if (collectionMode === "EXACT_DATE") {
//       // ✅ Prefer directly passed date, else fallback to formData
//       const exactDateValue = formData.get("balanceDueDate") as string;
// const formattedDate = new Date(exactDateValue + "T00:00:00Z").toISOString();
// // const formattedDate = new Date(exactDateValue).toISOString();

// variables.exactDate = formattedDate;

//       console.log("Exact Date for Balance Due:>>>>>>>>>>>", variables.exactDate);
//     }
//   }

//   if (fulfillmentMode === "SCHEDULED") {
//     const fulfillDateValue =
//       fulfillmentDate ||
//       formData.get("fulfillmentDate")?.toString() ||
//       new Date().toISOString();

//     variables.fulfillmentDate = new Date(fulfillDateValue).toISOString();
//   }

//   console.log("Variables:>>>>>>>>>>>", variables.exactDate )
//   const response = await admin.graphql(mutation, { variables });
//   const result = await response.json();

//   if (result.errors?.length) {
//     console.error("GraphQL Errors:", result.errors);
//   }
//   if (result.data?.sellingPlanGroupCreate?.userErrors?.length) {
//     console.error("User Errors:", result.data.sellingPlanGroupCreate.userErrors);
//   }

//   return result;
// }


import { CREATE_SELLING_PLAN_BASE } from "../graphql/mutation/sellingPlan";

type PaymentMode = "partial" | "full";
type FulfillmentMode = "ONHOLD" | "UNFULFILED" | "SCHEDULED";
type CollectionMode = "DAYS_AFTER" | "EXACT_DATE";

export async function createSellingPlan(
  admin: any,
  paymentMode: PaymentMode,
  products: any[],
  formData: FormData,
  {
    fulfillmentMode = "UNFULFILED",
    collectionMode = "DAYS_AFTER",
    customDays = 7,
    balanceDueDate,
    fulfillmentDate,
  }: {
    fulfillmentMode?: FulfillmentMode;
    collectionMode?: CollectionMode;
    customDays?: number;
    balanceDueDate?: string | Date;
    fulfillmentDate?: string | Date;
  } = {}
) {
  const variantIds = products.map((p) => p.variantId);
  const mutation = CREATE_SELLING_PLAN_BASE(paymentMode, fulfillmentMode, collectionMode);

  const variables: Record<string, any> = { variantIds };

  if (paymentMode === "partial") {
    variables.percentage = Number(formData.get("depositPercent"));

    if (collectionMode === "DAYS_AFTER") {
      variables.days = `P${customDays}D`;
    } else if (collectionMode === "EXACT_DATE") {
      const exactDateValue = balanceDueDate || formData.get("balanceDueDate")?.toString();
      if (!exactDateValue) throw new Error("balanceDueDate is required for EXACT_DATE collection mode");

      let exactDate: Date;
      // If input is plain date like "2025-12-31", append "T00:00:00Z" to treat as UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(exactDateValue))) {
        exactDate = new Date(exactDateValue + "T00:00:00Z");
      } else {
        exactDate = new Date(exactDateValue);
      }

      if (isNaN(exactDate.getTime())) throw new Error("Invalid balanceDueDate");

      variables.exactDate = exactDate.toISOString();
      console.log("Exact Date for Balance Due:>>>>>>>>>>>", variables.exactDate);
    }
  }

  if (fulfillmentMode === "SCHEDULED") {
    const fulfillDateValue = fulfillmentDate || formData.get("fulfillmentDate")?.toString() || new Date().toISOString();
    const fulfillDate = new Date(fulfillDateValue);

    if (isNaN(fulfillDate.getTime())) throw new Error("Invalid fulfillmentDate");

    variables.fulfillmentDate = fulfillDate.toISOString();
    console.log("Fulfillment Date:>>>>>>>>>>>", variables.fulfillmentDate);
  }

  console.log("GraphQL Variables:>>>>>>>>>>>", variables);

  const response = await admin.graphql(mutation, { variables });
  const result = await response.json();

  if (result.errors?.length) {
    console.error("GraphQL Errors:", result.errors);
  }
  if (result.data?.sellingPlanGroupCreate?.userErrors?.length) {
    console.error("User Errors:", result.data.sellingPlanGroupCreate.userErrors);
  }

  return result;
}

