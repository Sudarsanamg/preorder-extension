import { CREATE_SELLING_PLAN_BASE} from "../graphql/mutation/sellingPlan";

export async function createSellingPlan(admin: any, paymentMode: "partial" | "full", discountType: "none" | "percentage" | "flat", products: any[], formData: FormData) {
  const variantIds = products.map((p) => p.variantId);
  const mutation = CREATE_SELLING_PLAN_BASE(paymentMode, discountType);

  let variables: Record<string, any> = { variantIds };

  if (paymentMode === "partial") {
    variables.percentage = Number(formData.get("depositPercent"));
    variables.days = "P7D";
  }

  if (discountType === "percentage") {
    variables.discountPercentage = Number(formData.get("discountPercentage"));
  } else if (discountType === "flat") {
    variables.fixedValue = (formData.get("flatDiscount") ?? "0").toString();
  }

  const response = await admin.graphql(mutation, { variables });
  return response.json();
}
