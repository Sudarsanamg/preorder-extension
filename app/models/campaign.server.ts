import prisma from "app/db.server";

// Create a campaign

export async function createPreorderCampaign(data: {
  name: string;
  depositPercent: number;
  balanceDueDate: Date;
  refundDeadlineDays: number;
  releaseDate?: Date;
  status?: string;
  campaignEndDate?: Date;
}) {
  return prisma.preorderCampaign.create({
    data: {
      name: data.name,
      depositPercent: data.depositPercent,
      balanceDueDate: data.balanceDueDate,
      refundDeadlineDays: data.refundDeadlineDays,
      releaseDate: data.releaseDate,
      status: data.status ?? "active",
      campaignEndDate: data.campaignEndDate ? data.campaignEndDate : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

// Add product(s) to a campaign
export async function addProductsToCampaign(
  campaignId: string,
  products: { id: string; variantId?: string; totalInventory: number }[]
) {
  return prisma.preorderCampaignProduct.createMany({
    data: products.map((p) => ({
      campaignId,
      productId: p.id,
      variantId: p.variantId,
      maxQuantity: p.totalInventory
    })),
  });
}

// Fetch all campaigns
export async function getCampaigns() {
  return prisma.preorderCampaign.findMany({
    include: { products: true },
  });
}
