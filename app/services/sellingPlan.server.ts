import { CREATE_SELLING_PLAN_BASE} from "../graphql/mutation/sellingPlan";

export async function createSellingPlan(admin: any, paymentMode: "partial" | "full", products: any[], formData: FormData, customDays?: number | 7) {
  const variantIds = products.map((p) => p.variantId);
  const mutation = CREATE_SELLING_PLAN_BASE(paymentMode);

  let variables: Record<string, any> = { variantIds };

  if (paymentMode === "partial") {
    variables.percentage = Number(formData.get("depositPercent"));
    variables.days = `P7D`;
  }


  const response = await admin.graphql(mutation, { variables });
  return response.json();
}
