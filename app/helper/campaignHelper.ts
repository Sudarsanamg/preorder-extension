import type { CampaignType, DiscountType, Fulfilmentmode, scheduledFulfilmentType } from "@prisma/client";
import prisma from "app/db.server";
import { SET_PREORDER_METAFIELDS } from "app/graphql/mutation/metafields";
import { CREATE_CAMPAIGN, unpublishMutation } from "app/graphql/mutation/metaobject";
import {
  allowOutOfStockForVariants,
  DELETE_SELLING_PLAN_GROUP,
} from "app/graphql/mutation/sellingPlan";
import { publishMutation } from "app/graphql/queries/metaobject";
import { GET_PRODUCT_SELLING_PLAN_GROUPS } from "app/graphql/queries/sellingPlan";
import {
  addProductsToCampaign,
  createPreorderCampaign,
  deleteCampaign,
  getStoreIdByShopId,
  updateCampaignStatus,
} from "app/models/campaign.server";
import { createSellingPlan } from "app/services/sellingPlan.server";
import { removeDiscountFromVariants } from "./removeDiscountFromVariants";
import { applyDiscountToVariants } from "./applyDiscountToVariants";
// import { success } from "zod";
// import { GET_SHOP } from "app/graphql/queries/shop";

export const unPublishCampaign = async (
  admin: any,
  id: string,
  status: string,
  shopId?: string,
) => {
  const campaignId = id;
  try {
    await admin.graphql(unpublishMutation, {
      variables: {
        handle: { type: "preordercampaign", handle: id },
        status: "DRAFT",
      },
    });

    const store = await getStoreIdByShopId(shopId as string);
    const productsResponse = await prisma.preorderCampaign.findMany({
      where: {
        id: campaignId,
        storeId: store?.id,
      },
      select: {
        products: true,
      },
    });

    const products = productsResponse[0].products;

    // unpublish
    let metafields;
    if (status !== "DELETE") {
      metafields = products.flatMap((product: any) => [
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "preorder",
          type: "boolean",
          value: "false",
        },
      ]);
    }

    //delete all Metafields
    else {
      metafields = products.flatMap((product: any) => [
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "campaign_id",
          value: "null",
        },
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "preorder",
          value: "false",
        },
      ]);
    }

    try {
      for (let i = 0; i < metafields.length; i += 20) {
        const batch = metafields.slice(i, i + 20);
        await admin.graphql(SET_PREORDER_METAFIELDS, {
          variables: { metafields: batch },
        });
      }
    } catch (err) {
      console.error("❌ GraphQL mutation failed:", err);
      throw err;
    }

    const productResp = await admin.graphql(GET_PRODUCT_SELLING_PLAN_GROUPS, {
      variables: { id: products[0].productId },
    });
    const productData = await productResp.json();

    const groups =
      productData.data.product.sellingPlanGroups.edges.map(
        (edge: any) => edge.node,
      ) || [];

    const deletedGroups = [];
    const errors = [];

    for (const group of groups) {
      const deleteResp = await admin.graphql(DELETE_SELLING_PLAN_GROUP, {
        variables: { id: group.id },
      });
      const deleteData = await deleteResp.json();

      if (
        deleteData.data.sellingPlanGroupDelete.userErrors &&
        deleteData.data.sellingPlanGroupDelete.userErrors.length > 0
      ) {
        errors.push({
          groupId: group.id,
          errors: deleteData.data.sellingPlanGroupDelete.userErrors,
        });
      } else {
        deletedGroups.push(
          deleteData.data.sellingPlanGroupDelete.deletedSellingPlanGroupId,
        );
      }
    }

    await updateCampaignStatus(campaignId!, "UNPUBLISH", shopId!);

    removeDiscountFromVariants(
      admin,
      products.map((product: any) => product.variantId),
    );

    return {
      success: true,
      message: "Campaign unpublished successfully",
    };
  } catch (error) {
    console.log(error);
  }
};

export const publishCampaign = async (
  admin: any,
  id: string,
  shopId: string,
) => {
  const campaignId = id;

  try {
    await admin.graphql(publishMutation, {
      variables: {
        handle: { type: "preordercampaign", handle: id },
        status: "ACTIVE",
      },
    });
  } catch (error) {
    console.log(error);
  }

  const store = await getStoreIdByShopId(shopId);
  const campaignRecords = await prisma.preorderCampaign.findMany({
    where: {
      id: campaignId,
      storeId: store?.id,
    },
    select: {
      products: true,
    },
  });
  const products = campaignRecords[0].products;

  const campaignData = await prisma.preorderCampaign.findUnique({
    where: {
      id: campaignId,
      storeId: store?.id,
    },
  });

  const metafields = products.flatMap((product: any) => [
    {
      ownerId: product.variantId,
      namespace: "custom",
      key: "campaign_id",
      value: id,
    },
    {
      ownerId: product.variantId,
      namespace: "custom",
      key: "preorder",
      value: "true",
    },
    {
      ownerId: product.variantId,
      namespace: "custom",
      key: "preorder_end_date",
      type: "date_time",
      value: campaignData?.campaignEndDate,
    },
    {
      ownerId: product.variantId,
      namespace: "custom",
      key: "deposit_percent",
      type: "number_integer",
      value: String(campaignData?.depositPercent || "0"),
    },
    {
      ownerId: product.variantId,
      namespace: "custom",
      key: "balance_due_date",
      type: "date",
      value: campaignData?.balanceDueDate,
    },
    {
      ownerId: product.variantId,
      namespace: "custom",
      key: "preorder_max_units",
      type: "number_integer",
      value: String(product?.maxQuantity || "0"),
    },
    {
      ownerId: product.variantId,
      namespace: "custom",
      key: "preorder_units_sold",
      type: "number_integer",
      value: String(product?.unitsSold || "0"),
    },
  ]);
  const productMetafields = products.flatMap((product: any) => [
    {
      ownerId: product.productId,
      namespace: "custom",
      key: "campaign_id",
      type: "single_line_text_field",
      value: String(id),
    },
    {
      ownerId: product.productId,
      namespace: "custom",
      key: "preorder",
      type: "boolean",
      value: "true",
    },
    {
      ownerId: product.productId,
      namespace: "custom",
      key: "preorder_end_date",
      type: "date_time",
      value: campaignData?.campaignEndDate,
    },
    {
      ownerId: product.productId,
      namespace: "custom",
      key: "deposit_percent",
      type: "number_integer",
      value: String(campaignData?.depositPercent || "0"),
    },
    {
      ownerId: product.productId,
      namespace: "custom",
      key: "balance_due_date",
      type: "date",
      value: campaignData?.balanceDueDate,
    },
    {
      ownerId: product.productId,
      namespace: "custom",
      key: "preorder_max_units",
      type: "number_integer",
      value: String(product?.maxQuantity || "0"),
    },
    {
      ownerId: product.productId,
      namespace: "custom",
      key: "preorder_units_sold",
      type: "number_integer",
      value: String(product?.unitsSold || "0"),
    },
  ]);

  try {
    for (let i = 0; i < metafields.length; i += 20) {
      const batch = metafields.slice(i, i + 20);
      await admin.graphql(SET_PREORDER_METAFIELDS, {
        variables: { metafields: batch },
      });
    }

    for (let i = 0; i < productMetafields.length; i += 20) {
      const batch = productMetafields.slice(i, i + 20);
      await admin.graphql(SET_PREORDER_METAFIELDS, {
        variables: { metafields: batch },
      });
    }
  } catch (err) {
    console.error("❌ GraphQL mutation failed:", err);
    throw err;
  }

  //  const campaignData = await prisma.preorderCampaign.findUnique({
  //    where: { id: campaignId },
  //  });
  const formData = new FormData();
  formData.append("depositPercent", String(campaignData?.depositPercent));
  formData.append("balanceDueDate", String(campaignData?.balanceDueDate));

  await createSellingPlan(
    admin,
    campaignData?.paymentType === "FULLPAYMENT" ? "full" : "partial",
    products,
    formData,
    {
      fulfillmentMode: campaignData?.fulfilmentmode as Fulfilmentmode,
      collectionMode: "EXACT_DATE",
      fulfillmentDate: campaignData?.fulfilmentExactDate ?? undefined,
      customDays: 7,
      balanceDueDate: campaignData?.balanceDueDate ?? undefined,
    },
  );
  if (
    campaignData?.campaignType == "OUT_OF_STOCK" ||
    campaignData?.campaignType == "ALLWAYS"
  ) {
    // const arr = products.map((product: any) => {
    //   return {
    //     variantId: product.productId,
    //     productId: product.id,
    //   };
    // })
    allowOutOfStockForVariants(admin, products);
  }

  updateCampaignStatus(campaignId, "PUBLISHED", shopId);

  const variantIds = products.map((product: any) => {
    return product.variantId;
  });

  await applyDiscountToVariants(
    admin,
    variantIds,
    campaignData?.discountType as DiscountType,
    Number(campaignData?.discountPercent || 0),
    Number(campaignData?.discountFixed || 0),
  );
};



export const createCampaign = async (
  formData: any,
  admin: any,
  shopId: string,
) => {
  const intent = formData.get("intent");
  try {

  const campaign = await createPreorderCampaign({
    name: formData.get("name") as string,
    shopId: formData.get("shopId") as string,
    depositPercent: Number(formData.get("depositPercent")),
    balanceDueDate: new Date(formData.get("balanceDueDate") as string),
    refundDeadlineDays: Number(formData.get("refundDeadlineDays")),
    releaseDate: formData.get("campaignEndDate")
      ? new Date(formData.get("campaignEndDate") as string)
      : undefined,
    orderTags: JSON.parse((formData.get("orderTags") as string) || "[]"),
    customerTags: JSON.parse((formData.get("customerTags") as string) || "[]"),
    discountType: formData.get("discountType") as DiscountType,
    discountPercent: Number(formData.get("discountPercentage") || "0"),
    discountFixed: Number(formData.get("flatDiscount") || "0"),
    campaignType: formData.get("campaignType") as CampaignType,
    getDueByValt: formData.get("getDueByValt") == "true" ? true : false,
    totalOrders: 0,
    fulfilmentmode: formData.get("fulfilmentmode") as Fulfilmentmode,
    scheduledFulfilmentType: formData.get(
      "scheduledFulfilmentType",
    ) as scheduledFulfilmentType,
    fulfilmentDaysAfter: Number(formData.get("fulfilmentDaysAfter")),
    fulfilmentExactDate: new Date(formData.get("fulfilmentDate") as string),
    paymentType: formData.get("paymentMode") as string,
    campaignEndDate: new Date(formData.get("campaignEndDate") as string),
  });

  const products = JSON.parse((formData.get("products") as string) || "[]");

  if (products.length > 0) {
    await addProductsToCampaign(
      campaign.id,
      products,
      formData.get("shopId") as string,
    );

    const campaignType = formData.get("campaignType") as CampaignType;
    const metafields = products.flatMap((product: any) => [
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "campaign_id",
        type: "single_line_text_field",
        value: String(campaign.id),
      },
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "preorder",
        type: "boolean",
        value: intent === "SAVE" ? "false" : "true",
      },
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "preorder_end_date",
        type: "date_time",
        value: new Date(
          formData.get("campaignEndDate") as string,
        ).toISOString(),
      },
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "deposit_percent",
        type: "number_integer",
        value: String(formData.get("depositPercent") || "0"),
      },
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "balance_due_date",
        type: "date",
        value: new Date(formData.get("balanceDueDate") as string).toISOString(),
      },
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "preorder_max_units",
        type: "number_integer",
        value:
          campaignType == "IN_STOCK"
            ? String(product.variantInventory)
            : String(product?.maxUnit || "0"),
      },
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "preorder_units_sold",
        type: "number_integer",
        value: "0",
      },
    ]);

    const productMetafields = products.flatMap((product: any) => [
      {
        ownerId: product.productId,
        namespace: "custom",
        key: "campaign_id",
        type: "single_line_text_field",
        value: String(campaign.id),
      },
      {
        ownerId: product.productId,
        namespace: "custom",
        key: "preorder",
        type: "boolean",
        value: intent === "SAVE" ? "false" : "true",
      },
      {
        ownerId: product.productId,
        namespace: "custom",
        key: "preorder_end_date",
        type: "date_time",
        value: new Date(
          formData.get("campaignEndDate") as string,
        ).toISOString(),
      },
      {
        ownerId: product.productId,
        namespace: "custom",
        key: "deposit_percent",
        type: "number_integer",
        value: String(formData.get("depositPercent") || "0"),
      },
      {
        ownerId: product.productId,
        namespace: "custom",
        key: "balance_due_date",
        type: "date",
        value: new Date(formData.get("balanceDueDate") as string).toISOString(),
      },
      {
        ownerId: product.productId,
        namespace: "custom",
        key: "preorder_max_units",
        type: "number_integer",
        value:
          campaignType == "IN_STOCK"
            ? String(product.variantInventory)
            : String(product?.maxUnit || "0"),
      },
      {
        ownerId: product.productId,
        namespace: "custom",
        key: "preorder_units_sold",
        type: "number_integer",
        value: "0",
      },
    ]);
    try {
      for (let i = 0; i < metafields.length; i += 20) {
        const batch = metafields.slice(i, i + 20);
        await admin.graphql(SET_PREORDER_METAFIELDS, {
          variables: { metafields: batch },
        });
      }

      for (let i = 0; i < productMetafields.length; i += 20) {
        const batch = productMetafields.slice(i, i + 20);

        await admin.graphql(SET_PREORDER_METAFIELDS, {
          variables: { metafields: batch },
        });
      }
    } catch (err) {
      console.error("GraphQL mutation failed:", err);
      throw err;
    }
  }
  // }

  if (intent !== "SAVE") {
    const discountType = formData.get("discountType") as DiscountType;

    const varientIds = products.map((p: any) => p.variantId);
    await applyDiscountToVariants(
      admin,
      varientIds,
      discountType,
      Number(formData.get("discountPercentage") || 0),
      Number(formData.get("flatDiscount") || 0),
    );

    await createSellingPlan(
      admin,
      formData.get("paymentMode") as "partial" | "full",
      products,
      formData,
      {
        fulfillmentMode: formData.get("fulfilmentmode") as Fulfilmentmode,
        collectionMode: formData.get(
          "collectionMode",
        ) as scheduledFulfilmentType,
        fulfillmentDate: new Date(
          formData.get("fulfilmentDate") as string,
        ).toISOString(),
        customDays: Number(formData.get("paymentAfterDays") as string),
        balanceDueDate: new Date(
          formData.get("balanceDueDate") as string,
        ).toISOString(),
      },
    );
    if (
      formData.get("campaignType") == "OUT_OF_STOCK" ||
      formData.get("campaignType") == "ALLWAYS"
    ) {
      allowOutOfStockForVariants(admin, products);
    }
  }

  const designFields = JSON.parse(formData.get("designFields") as string);
  const campaignFields = [
    {
      key: "object",
      value: JSON.stringify({
        campaignData: {
          campaign_id: String(campaign.id),
          name: (formData.get("name") as string) || "Untitled Campaign",
          status: "publish",
          button_text: (formData.get("buttonText") as string) || "Preorder",
          shipping_message:
            (formData.get("shippingMessage") as string) ||
            "Ship as soon as possible",
          payment_type: (formData.get("paymentMode") as string) || "Full",
          payment_schedule: {
            type: formData.get("collectionMode") as scheduledFulfilmentType,
            value:
              (formData.get("collectionMode") as scheduledFulfilmentType) ===
              "DAYS_AFTER"
                ? formData.get("paymentAfterDays")
                : new Date(
                    formData.get("balanceDueDate") as string,
                  ).toISOString(),
          },
          ppercent: String(formData.get("depositPercent") || "0"),
          paymentduedate: new Date(
            (formData.get("balanceDueDate") as string) || Date.now(),
          ).toISOString(),
          campaign_end_date: new Date(
            (formData.get("campaignEndDate") as string) || Date.now(),
          ).toISOString(),
          discount_type: (formData.get("discountType") as string) || "none",
          discountpercent:
            (formData.get("discountPercentage") as string) || "0",
          discountfixed: (formData.get("flatDiscount") as string) || "0",
          campaigntags: JSON.parse(
            (formData.get("orderTags") as string) || "[]",
          ).join(","),
          customerTags: JSON.parse(
            (formData.get("customerTags") as string) || "[]",
          ).join(","),
          campaigntype: formData.get("campaignType") as CampaignType,
          fulfillment: {
            type: formData.get("fulfilmentmode") as Fulfilmentmode,
            schedule: {
              type: formData.get(
                "scheduledFulfilmentType",
              ) as scheduledFulfilmentType,
              value:
                (formData.get(
                  "scheduledFulfilmentType",
                ) as scheduledFulfilmentType) === "DAYS_AFTER"
                  ? formData.get("fulfilmentDaysAfter")
                  : new Date(
                      formData.get("fulfilmentDate") as string,
                    ).toISOString(),
            },
          },
        },
        designFields: {
          ...designFields,
        },
      }),
    },
  ];

   await admin.graphql(CREATE_CAMPAIGN, {
    variables: {
      fields: [
        { key: "campaign_id", value: String(campaign.id) },
        ...campaignFields,
      ],
    },
  });


  await updateCampaignStatus(
    campaign.id,
    intent === "SAVE" ? "DRAFT" : "PUBLISHED",
    shopId,
  );
  

  return { success: true, campaignId: campaign.id };
      
  } catch (error) {
    console.error("Error creating campaign:", error);
    return {success : false , error: "Error creating campaign" };
  }
};

export const handleCampaignStatusChange = async (
  admin: any,
  campaignId: string,
  newStatus: string,
  shopId: string,
) => {
  const store = await getStoreIdByShopId(shopId as string);

  if (newStatus === "DRAFT") {
    await unPublishCampaign(admin, campaignId, newStatus,shopId );
    await prisma.preorderCampaign.update({
      where: {
        id: campaignId,
        storeId: store?.id,
      },
      data: {
        status: "DRAFT",
      },
    });
  }
  if (newStatus === "PUBLISHED") {
    await publishCampaign(admin, campaignId, shopId);
  }
  if (newStatus === "UNPUBLISHED") {
    await unPublishCampaign(admin, campaignId,newStatus, shopId );
  }
  if (newStatus === "DELETE") {
    await unPublishCampaign(admin, campaignId,newStatus, shopId );

    await deleteCampaign(campaignId, shopId);
  }
};
