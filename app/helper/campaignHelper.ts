import type { DiscountType, Fulfilmentmode } from "@prisma/client";
import prisma from "app/db.server";
import { SET_PREORDER_METAFIELDS } from "app/graphql/mutation/metafields";
import { unpublishMutation } from "app/graphql/mutation/metaobject";
import { allowOutOfStockForVariants, DELETE_SELLING_PLAN_GROUP } from "app/graphql/mutation/sellingPlan";
import { publishMutation } from "app/graphql/queries/metaobject";
import { GET_PRODUCT_SELLING_PLAN_GROUPS } from "app/graphql/queries/sellingPlan";
import { deleteCampaign, getStoreIdByShopId, updateCampaignStatus } from "app/models/campaign.server";
import { createSellingPlan } from "app/services/sellingPlan.server";
import { removeDiscountFromVariants } from "./removeDiscountFromVariants";
import { applyDiscountToVariants } from "./applyDiscountToVariants";
// import { GET_SHOP } from "app/graphql/queries/shop";

export const unPublishCampaign = async (admin: any, id: string , shopId?: string) => {

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
         storeId: store?.id
         },
      select: {
        products: true,
      },
    });

    const products = productsResponse[0].products;

    const metafields = products.flatMap((product: any) => [
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "campaign_id",
        type: "single_line_text_field",
        value: "null",
      },
      {
        ownerId: product.variantId,
        namespace: "custom",
        key: "preorder",
        type: "boolean",
        value: "false",
      },
    ]);

    try {
      const graphqlResponse = await admin.graphql(SET_PREORDER_METAFIELDS, {
        variables: { metafields },
      });

      const response = await graphqlResponse.json();

      if (response.data?.metafieldsSet?.userErrors?.length) {
        console.error(
          "///////////////////////",
          response.data.metafieldsSet.userErrors,
        );
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

    await updateCampaignStatus(campaignId!, "UNPUBLISH",shopId!);

    removeDiscountFromVariants(
      admin,
      products.map((product: any) => product.variantId),
    );

    return {
        success: true,
        message : "Campaign unpublished successfully"    
    }
  } catch (error) {
    console.log(error);
  }

};


export const publishCampaign = async (admin: any, id: string, shopId: string) => {
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
          storeId: store?.id
        },
        select: {
          products: true,
        },
      });

      const products = campaignRecords?.[0]?.products || [];
    
      const campaignData = await prisma.preorderCampaign.findUnique({
        where: { 
          id: campaignId,
          storeId: store?.id
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
        value:campaignData?.campaignEndDate,
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
        value: String(product?.maxUnit || "0"),
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
       const graphqlResponse = await admin.graphql(SET_PREORDER_METAFIELDS, {
         variables: { metafields },
       });
       await admin.graphql(SET_PREORDER_METAFIELDS, {
         variables: { metafields: productMetafields },
       });

       const response = await graphqlResponse.json();

       if (response.data?.metafieldsSet?.userErrors?.length) {
         console.error(response.data.metafieldsSet.userErrors);
       }
     } catch (err) {
       console.error("❌ GraphQL mutation failed:", err);
       throw err;
     }

    //  const campaignData = await prisma.preorderCampaign.findUnique({
    //    where: { id: campaignId },
    //  });
     const formData = new FormData();
     formData.append("depositPercent",String(campaignData?.depositPercent));
     formData.append("balanceDueDate",String(campaignData?.balanceDueDate));

      await createSellingPlan(
           admin,
           campaignData?.paymentType ==='FULLPAYMENT'? 'full': 'partial',
           products,
           formData,
           {
             fulfillmentMode: campaignData?.fulfilmentmode as Fulfilmentmode,
             collectionMode: 'EXACT_DATE',
             fulfillmentDate: 
               campaignData?.fulfilmentExactDate ?? undefined
             ,
             customDays: 7,
             balanceDueDate: campaignData?.balanceDueDate ?? undefined,
           },
         );
         if (
           campaignData?.campaignType == 'OUT_OF_STOCK' ||
           campaignData?.campaignType == 'ALLWAYS'
         ) {
          // const arr = products.map((product: any) => {
          //   return {
          //     variantId: product.productId,
          //     productId: product.id,
          //   };
          // })
           allowOutOfStockForVariants(admin, products);
         }

        updateCampaignStatus(campaignId, "PUBLISHED",shopId);

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



export const handleCampaignStatusChange = async (
  admin: any,
  campaignId: string,
  newStatus: string,
  shopId: string
)=>{
  const store = await getStoreIdByShopId(shopId as string);

  if(newStatus === "DRAFT"){
    await unPublishCampaign(admin,campaignId, shopId);
    await prisma.preorderCampaign.update({
      where: { 
        id: campaignId,
        storeId: store?.id
       },
      data: {
        status: "DRAFT",
      },
    })
  }
  if(newStatus === "PUBLISHED"){
    await publishCampaign(admin,campaignId,shopId);
  }
  if(newStatus === "UNPUBLISHED"){
    await unPublishCampaign(admin,campaignId, shopId);
  }
  if(newStatus === "DELETE"){
    await unPublishCampaign(admin,campaignId);

    await deleteCampaign(campaignId,shopId);
  }

  
}