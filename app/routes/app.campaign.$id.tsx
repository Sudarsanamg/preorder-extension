import {
  addProductsToCampaign,
  createPreorderCampaign,
  deleteCampaign,
  getCampaignById,
  getCampaignStatus,
  replaceProductsInCampaign,
  updateCampaign,
  updateCampaignStatus,
} from "../models/campaign.server";
import { useState, useCallback, useEffect } from "react";
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  AppProvider,
  Button,
  ButtonGroup,
  BlockStack,
  Text,
  TextField,
  Page,
  LegacyStack,
  RadioButton,
  Card,
  DatePicker,
  Popover,
  Icon,
  Tabs,
  Banner,
  Badge,
  InlineStack,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import {
  useSubmit,
  useNavigate,
  useLoaderData,
  Link,
  useNavigation,
} from "@remix-run/react";
import {
  DiscountIcon,
  CalendarCheckIcon,
  DeleteIcon,
  CashDollarIcon,
} from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ResourcePicker,  } from "@shopify/app-bridge/actions";
import { useAppBridge } from "../components/AppBridgeProvider";
import { Modal, TitleBar, SaveBar } from "@shopify/app-bridge-react";
import { DesignFields } from "app/types/type";
import PreviewDesign from "app/components/PreviewDesign";
import prisma from "app/db.server";
import {
  removeMetaFieldMutation,
  SET_PREORDER_METAFIELDS,
} from "app/graphql/mutation/metafields";
import { createSellingPlan } from "app/services/sellingPlan.server";
import {
  CREATE_CAMPAIGN,
  unpublishMutation,
} from "app/graphql/mutation/metaobject";
import {
  GET_VARIENT_BY_IDS,
} from "app/graphql/queries/products";
import { fetchMetaobject } from "app/services/metaobject.server";
import {
  DELETE_SELLING_PLAN_GROUP,
  GET_VARIANT_SELLING_PLANS,
  removeVariantMutation,
} from "app/graphql/mutation/sellingPlan";
import {
  GetCampaignId,
  publishMutation,
  updateCampaignMutation,
} from "app/graphql/queries/metaobject";
import { GET_COLLECTION_PRODUCTS, GET_SHOP } from "app/graphql/queries/shop";
import { GET_PRODUCT_SELLING_PLAN_GROUPS } from "app/graphql/queries/sellingPlan";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  if (intent === "fetchProductsInCollection") {
    const collectionId = url.searchParams.get("collectionId");

    try {
      const response = await admin.graphql(GET_COLLECTION_PRODUCTS, {
        variables: { id: collectionId },
      });
      const resData : any= (await response.json) ? await response.json() : response;

      const prod = resData.data.collection.products.edges.flatMap(
        (edge: any) => {
          const node = edge.node;

          return node.variants.edges.map((v: any) => ({
            productId: node.id,
            productTitle: node.title,
            handle: node.handle,
            productImage: node.images.edges[0]?.node?.url || null, 
            variantId: v.node.id,
            variantTitle: v.node.displayName,
            variantPrice: v.node.price,
            variantInventory: v.node.inventoryQuantity,
            maxUnit: 0,
          }));
        },
      );

      return json({ prod });
    } catch (error) {
      console.error("Error fetching products:", error);
      return json({ error: "Failed to fetch products" });
    }
  } else {
    const campaign = await getCampaignById(params.id!);
    const varientId = campaign?.products?.map((p) => p.variantId) || [];
    if (varientId.length === 0) {
      return json({ campaign, products: [] });
    }
    const response = await admin.graphql(GET_VARIENT_BY_IDS, {
      variables: { ids: varientId },
    });

    const data = await response.json();

    const variants = data.data.nodes.map((variant: any) => ({
      id: variant.id,
      title: variant.title,
      image: variant.product?.featuredImage?.url ?? null,
      price: variant.price ?? null, 
      inventory: variant.inventoryQuantity ?? null,
      maxUnit: variant.metafield?.value ?? null,
      productId: variant.product?.id ?? null,
      productTitle: variant.product?.title ?? null,
    }));

    let campaignSettingsResponse = await fetchMetaobject(
      admin,
      params.id!,
      "preordercampaign",
    );
    let parsedCampaignSettingsResponse = await campaignSettingsResponse.json();
    const metaobject = parsedCampaignSettingsResponse.data.metaobjectByHandle;
    const objectField = metaobject.fields.find((f:any) => f.key === "object");
    const parsedObject = JSON.parse(objectField.value);
    parsedCampaignSettingsResponse = parsedObject.campaignData;
    let parsedDesignSettingsResponse = parsedObject.designFields;

    const products = variants.map((variant:any) => ({
      productId: variant.productId,
      variantId: variant.id,
      variantTitle: variant.title,
      variantPrice: variant.price,
      variantInventory: variant.inventory,
      maxUnit: variant.maxUnit,
      productImage: variant.image,
      productTitle: variant.productTitle,
    }));

    return json({
      campaign,
      products,
      parsedDesignSettingsResponse,
      parsedCampaignSettingsResponse,
    });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const secondaryIntent = formData.get("secondaryIntent") as string;
  const campaignCurrentStatusResponse = await getCampaignStatus(params.id!);
  const campaignCurrentStatus = campaignCurrentStatusResponse?.status;
  if (intent === "delete-campaign") {
    const id = formData.get("id");
    await deleteCampaign(id);
    return redirect("/app");
  }
  if (intent === "update-campaign") {
    try {
      await updateCampaign({
        id: params.id!,
        name: formData.get("name") as string,
        depositPercent: Number(formData.get("depositPercent")),
        balanceDueDate: new Date(formData.get("balanceDueDate") as string),
        refundDeadlineDays: Number(formData.get("refundDeadlineDays")),
        releaseDate: formData.get("campaignEndDate")
          ? new Date(formData.get("campaignEndDate") as string)
          : undefined,
        campaignType: Number(formData.get("campaignType")),
        orderTags: JSON.parse((formData.get("orderTags") as string) || "{}"),
        customerTags: JSON.parse(
          (formData.get("customerTags") as string) || "{}",
        ),
        status: campaignCurrentStatus,
      });

   
      const updatedProducts = JSON.parse(
        (formData.get("products") as string) || "[]",
      );
      await replaceProductsInCampaign(String(params.id!), updatedProducts);

      const handleRes = await admin.graphql(GetCampaignId, {
        variables: {
          handle: { type: "preordercampaign", handle: params.id },
        },
      });

      const handleData = await handleRes.json();
      const metaobjectId = handleData?.data?.metaobjectByHandle?.id;

      if (!metaobjectId) {
        throw new Error(
          "Campaign metaobject not found for handle: " + params.id,
        );
      }
      const designFields = JSON.parse(formData.get("designFields") as string);
      const campaignFields = [
        {
          key: "object",
          value: JSON.stringify({
            campaignData :{
            campaign_id: String(params.id),
            name: (formData.get("name") as string) || "Untitled Campaign",
            status: "publish",
            button_text: (formData.get("buttonText") as string) || "Preorder",
            shipping_message:
              (formData.get("shippingMessage") as string) ||
              "Ship as soon as possible",
            payment_type: (formData.get("paymentMode") as string) || "Full",
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
            campaigntype: String(formData.get("campaignType") as string),
          },
          designFields: {
                  ...designFields,
            },

          }),
        },
      ];

      const campaignUpdateResponse = await admin.graphql(
        updateCampaignMutation,
        {
          variables: {
            id: metaobjectId,
            metaobject: { fields: campaignFields },
          },
        },
      );

      const parsedCampaign = await campaignUpdateResponse.json();

      if (parsedCampaign?.data?.metaobjectUpdate?.userErrors?.length) {
        console.error(
          "Campaign Update Errors:",
          parsedCampaign.data.metaobjectUpdate.userErrors,
        );
      } else {
        console.log(
          "Updated Campaign Metaobject:",
          parsedCampaign.data.metaobjectUpdate.metaobject,
        );
      }

      const products = JSON.parse((formData.get("products") as string) || "[]");

      const metafields = products.flatMap((product: any) => [
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "campaign_id",
          type: "single_line_text_field",
          value: String(params.id),
        },
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "preorder",
          type: "boolean",
          value: "true",
        },
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "release_date",
          type: "date",
          value: "2025-08-30",
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
          value: new Date(
            formData.get("balanceDueDate") as string,
          ).toISOString(),
        },
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "preorder_max_units",
          type: "number_integer",
          value: String(product?.maxUnit || "0"),
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
          value: String(params.id),
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
          key: "release_date",
          type: "date",
          value: "2025-08-30",
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
          value: new Date(
            formData.get("balanceDueDate") as string,
          ).toISOString(),
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
         await admin.graphql(SET_PREORDER_METAFIELDS, {
          variables: { metafields },
        });

        await admin.graphql(SET_PREORDER_METAFIELDS, {
          variables: { metafields: productMetafields },
        });
       
      } catch (err) {
        console.error("GraphQL mutation failed:", err);
        throw err;
      }

      const removedVarients = formData.get("removedVarients") as string;
      const parsedRemovedVarients = removedVarients
        ? JSON.parse(removedVarients)
        : [];

      if (parsedRemovedVarients.length > 0) {
        //need to remove selling group and
        //remove metafields
        for (const variantId of parsedRemovedVarients) {
          const { data } = await admin.graphql(GET_VARIANT_SELLING_PLANS, {
            variables: {
              id: variantId,
            },
          });

          const groups = data?.productVariant?.sellingPlanGroups?.edges || [];
          for (const g of groups) {
            const groupId = g.node.id;

            await admin.graphql(removeVariantMutation, {
              variables: {
                groupId,
                variantIds: [variantId],
              },
            });
          }
        }


        const metafields = parsedRemovedVarients.flatMap((varientId: any) => [
          {
            ownerId: varientId,
            namespace: "custom",
            key: "campaign_id",
            type: "single_line_text_field",
            value: "null",
          },
          {
            ownerId: varientId,
            namespace: "custom",
            key: "preorder",
            type: "boolean",
            value: "false",
          },
          {
            ownerId: varientId,
            namespace: "custom",
            key: "campaign_id",
            type: "single_line_text_field",
            value: "null",
          },
          {
            ownerId: varientId,
            namespace: "custom",
            key: "preorder",
            type: "boolean",
            value: "false",
          },
        ]);

        try {
          await admin.graphql(removeMetaFieldMutation, {
            variables: { metafields },
          });

        } catch (err) {
          console.error("GraphQL mutation failed:", err);
          throw err;
        }
      }

      return redirect(`/app/`);
    } catch (err) {
      console.error("Update Campaign Exception:", err);
      throw err; // let Remix handle the error page
    }
  }

  if (intent === "publish-campaign") {
    const id = formData.get("id");
    try {
      const res = await admin.graphql(publishMutation, {
        variables: {
          handle: { type: "preordercampaign", handle: id },
          status: "ACTIVE",
        },
      });
    } catch (error) {
      console.log(error);
    }

    const products = JSON.parse((formData.get("products") as string) || "[]");
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
    ]);

    try {
      const graphqlResponse = await admin.graphql(SET_PREORDER_METAFIELDS, {
        variables: { metafields },
      });

      const response = await graphqlResponse.json();

      if (response.data?.metafieldsSet?.userErrors?.length) {
        console.error(response.data.metafieldsSet.userErrors,
        );
      }
    } catch (err) {
      console.error("❌ GraphQL mutation failed:", err);
      throw err;
    }

    const paymentMode = formData.get("paymentMode") as "partial" | "full";
    const discountType = formData.get("discountType") as
      | "none"
      | "percentage"
      | "flat";

    const res = await createSellingPlan(
      admin,
      paymentMode,
      discountType,
      products,
      formData,
    );
    await updateCampaignStatus(params.id!, "PUBLISHED");
    return redirect(`/app/`);
  }

  if (intent === "unpublish-campaign") {
    const id = formData.get("id");
    try {
      const res = await admin.graphql(unpublishMutation, {
        variables: {
          handle: { type: "preordercampaign", handle: id }, // 👈 your campaign UUID
          status: "DRAFT",
        },
      });



      const products = JSON.parse((formData.get("products") as string) || "[]");

      const metafields = products.flatMap((product:any) => [
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "campaign_id",
          type: "single_line_text_field",
          value: 'null',
        },
        {
          ownerId: product.variantId,
          namespace: "custom",
          key: "preorder",
          type: "boolean",
          value: "false",
        },
        {
          ownerId: product.productId,
          namespace: "custom",
          key: "campaign_id",
          type: "single_line_text_field",
          value: 'null',
        },
        {
          ownerId: product.productId,
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

        const response = await graphqlResponse.json(); // 👈 parse it

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
          (edge:any) => edge.node,
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

      await updateCampaignStatus(params.id!, "UNPUBLISH");

      // get totalorders of the campaign
      const totalOrdersResponse = await prisma.preorderCampaign.findFirst({
        where: {
          id: params.id!,
        },
      });

      const totalOrders = totalOrdersResponse?.totalOrders || 0;

      if (secondaryIntent === "delete-campaign") {
        await deleteCampaign(params.id!);
      }

      const response = await admin.graphql(GET_SHOP);
      const data = await response.json();
      const storeId = data.data.shop.id;

      if (secondaryIntent === "delete-campaign-create-new") {
        const campaign = await createPreorderCampaign({
          name: formData.get("name") as string,
          depositPercent: Number(formData.get("depositPercent")),
          balanceDueDate: new Date(formData.get("balanceDueDate") as string),
          refundDeadlineDays: Number(formData.get("refundDeadlineDays")),
          releaseDate: formData.get("campaignEndDate")
            ? new Date(formData.get("campaignEndDate") as string)
            : undefined,
          orderTags: JSON.parse((formData.get("orderTags") as string) || "[]"),
          customerTags: JSON.parse(
            (formData.get("customerTags") as string) || "[]",
          ),
          discountType: formData.get("discountType") as string,
          discountPercent: Number(formData.get("discountPercentage") || "0"),
          discountFixed: Number(formData.get("flatDiscount") || "0"),
          campaignType: Number(formData.get("campaignType")),
          storeId: storeId,
          getDueByValt: false,
          totalOrders: totalOrders,
          status: campaignCurrentStatus,
        });

        const products = JSON.parse(
          (formData.get("products") as string) || "[]",
        );

        if (products.length > 0) {
          await addProductsToCampaign(campaign.id, products);

          const campaignType = Number(formData.get("campaignType"));
          //if campaign type === 3 then inventory quantity need to update
          const metafields = products.flatMap((product: any) => [
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "campaign_id",
              type: "single_line_text_field",
              value: String(campaign.id),
            },
            {
              ownerId: product.productId,
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
              value: "true",
            },
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "release_date",
              type: "date",
              value: "2025-08-30",
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
              value: new Date(
                formData.get("balanceDueDate") as string,
              ).toISOString(),
            },
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "preorder_max_units",
              type: "number_integer",
              value: campaignType == 3 ? String(product.variantInventory) :String(product?.maxUnit || "0"),
            },
          ]);

          try {
            const response = await admin.graphql(SET_PREORDER_METAFIELDS, {
              variables: { metafields },
            });
            console.log("GraphQL response:", response);
            const data = await response.json();
            console.log(data,'{{{{{{{{{{{{{{{{');
            console.log(JSON.stringify(data, null, 2));

          } catch (err) {
            console.error("GraphQL mutation failed:", err);
            throw err;
          }
        }

        // if the payment option is partial
        const paymentMode = formData.get("paymentMode") as "partial" | "full";
        const discountType = formData.get("discountType") as
          | "none"
          | "percentage"
          | "flat";

        // const products = JSON.parse(formData.get("products") as string);
         await createSellingPlan(
          admin,
          paymentMode,
          discountType,
          products,
          formData,
        );

        const designFields = JSON.parse(formData.get("designFields") as string);
        

          const campaignFields = [
            {
              key: "object",
              value: JSON.stringify({
                campaignData :{
                campaign_id: String(campaign.id),
                name: (formData.get("name") as string) || "Untitled Campaign",
                status: "publish",
                button_text:
                  (formData.get("buttonText") as string) || "Preorder",
                shipping_message:
                  (formData.get("shippingMessage") as string) ||
                  "Ship as soon as possible",
                payment_type: (formData.get("paymentMode") as string) || "Full",
                ppercent: String(formData.get("depositPercent") || "0"),
                paymentduedate: new Date(
                  (formData.get("balanceDueDate") as string) || Date.now(),
                ).toISOString(),
                campaign_end_date: new Date(
                  (formData.get("campaignEndDate") as string) || Date.now(),
                ).toISOString(),
                discount_type:
                  (formData.get("discountType") as string) || "none",
                discountpercent:
                  (formData.get("discountPercentage") as string) || "0",
                discountfixed: (formData.get("flatDiscount") as string) || "0",
                campaigntags: JSON.parse(
                  (formData.get("orderTags") as string) || "[]",
                ).join(","),
                campaigntype: String(formData.get("campaignType") as string),
              },
                designFields: {
                  ...designFields
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
        

        await updateCampaignStatus(campaign.id, "PUBLISHED");
        await deleteCampaign(params.id!);
        const removedVarients = formData.get("removedVarients") as string;
        const parsedRemovedVarients = removedVarients
          ? JSON.parse(removedVarients)
          : [];

        if (parsedRemovedVarients.length > 0) {
          //need to remove selling group and
          //remove metafields
          for (const variantId of parsedRemovedVarients) {
            const { data } = await admin.graphql(GET_VARIANT_SELLING_PLANS, {
              variables: {
                id: variantId,
              },
            });

            const groups = data?.productVariant?.sellingPlanGroups?.edges || [];
            for (const g of groups) {
              const groupId = g.node.id;

              // Step 2: remove variant from group
              await admin.graphql(removeVariantMutation, {
                variables: {
                  groupId,
                  variantIds: [variantId],
                },
              });
            }
          }

          //remove metafields

          const metafields = parsedRemovedVarients.flatMap((varientId: any) => [
            {
              ownerId: varientId,
              namespace: "custom",
              key: "campaign_id",
              type: "single_line_text_field",
              value: "null",
            },
            {
              ownerId: varientId,
              namespace: "custom",
              key: "preorder",
              type: "boolean",
              value: "false",
            },
            {
              ownerId: varientId,
              namespace: "custom",
              key: "campaign_id",
              type: "single_line_text_field",
              value: "null",
            },
            {
              ownerId: varientId,
              namespace: "custom",
              key: "preorder",
              type: "boolean",
              value: "false",
            },
          ]);

          try {
            await admin.graphql(
              removeMetaFieldMutation,
              {
                variables: { metafields },
              },
            );

          } catch (err) {
            console.error("GraphQL mutation failed:", err);
            throw err;
          }
        }

        return redirect("/app");
      }

      return redirect(`/app`);
    } catch (error) {
      console.log(error);
    }
  }

  return null;
};

export default function CampaignDetail() {
 const { campaign, products, parsedDesignSettingsResponse, parsedCampaignSettingsResponse } =
  useLoaderData<typeof loader>() as {
    campaign: any;
    products: any[];
    parsedDesignSettingsResponse: any;
    parsedCampaignSettingsResponse: any;
  };
  const [buttonLoading, setButtonLoading] = useState({
    publish: false,
    delete: false,
  });

  const navigation = useNavigation();
  const campaignSettingsMap =  parsedCampaignSettingsResponse
  const parsedCampaignData = campaignSettingsMap
  const designFieldsMap = parsedDesignSettingsResponse
  const parsedDesignFields = designFieldsMap;
  const submit = useSubmit();
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState(campaign?.name);
  const [selected, setSelected] = useState(0);
  const [productTagInput, setProductTagInput] = useState("");
  const [customerTagInput, setCustomerTagInput] = useState("");
  const [productTags, setProductTags] = useState<string[]>(
    parsedCampaignData?.campaigntags
      ? parsedCampaignData?.campaigntags.split(",")
      : [],
  );
  const [customerTags, setCustomerTags] = useState<string[]>([]);
  const [preOrderNoteKey, setPreOrderNoteKey] = useState("Note");
  const [preOrderNoteValue, setPreOrderNoteValue] = useState("Preorder");
  const [selectedOption, setSelectedOption] = useState(
    Number(parsedCampaignData?.campaigntype),
  );
  const [buttonText, setButtonText] = useState(parsedCampaignData?.button_text);
  const [shippingMessage, setShippingMessage] = useState(
    parsedCampaignData?.shipping_message,
  );
  const [partialPaymentPercentage, setPartialPaymentPercentage] = useState(
    campaign?.depositPercent,
  );
  const [paymentMode, setPaymentMode] = useState(
    parsedCampaignData?.payment_type === "full" ? "full" : "partial",
  );
  const [partialPaymentType, setPartialPaymentType] = useState("percent");
  const [duePaymentType, setDuePaymentType] = useState(2);
  const [{ month, year }, setMonthYear] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(),
    end: new Date(),
  });
  const [popoverActive, setPopoverActive] = useState(false);
  const [DueDateinputValue, setDueDateInputValue] = useState(
    new Date(
      campaign?.balanceDueDate ? campaign.balanceDueDate : new Date(),
    ).toLocaleDateString(),
  );
  const [productRadio, setproductRadio] = useState("option1");
  const [selectedProducts, setSelectedProducts] = useState(products || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState<Date | null>(
    parsedCampaignData?.campaign_end_date
      ? new Date(parsedCampaignData?.campaign_end_date)
      : null,
  );
  
  const [campaignEndPicker, setCampaignEndPicker] = useState({
  month: campaignEndDate?.getMonth(), 
  year: campaignEndDate?.getFullYear(),
  selected: {
    start: campaignEndDate,
    end: campaignEndDate, 
  },
  popoverActive: false,
  inputValue: campaignEndDate?.toLocaleDateString(), 
});
const hours = campaignEndDate?.getHours().toString().padStart(2, "0");
const minutes = campaignEndDate?.getMinutes().toString().padStart(2, "0");
const formattedTime = `${hours}:${minutes}`;
  const [campaignEndTime, setCampaignEndTime] = useState(
    formattedTime
  );
  const [criticalChange, setCriticalChange] = useState(false);
  const [partialPaymentText, setPartialPaymentText] =
    useState("Partial payment");
  const [partialPaymentInfoText, setPartialPaymentInfoText] = useState(
    "Pay {payment} now and {remaining} will be charged on {date}",
  );
  const [removedVarients, setRemovedVarients] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [designFields, setDesignFields] = useState<DesignFields>({
    messageFontSize: parsedDesignFields?.messageFontSize,
    messageColor: parsedDesignFields?.messageColor,
    fontFamily: parsedDesignFields?.fontFamily,
    buttonStyle: parsedDesignFields?.buttonStyle,
    buttonBackgroundColor: parsedDesignFields?.buttonBackgroundColor,
    gradientDegree: parsedDesignFields?.gradientDegree,
    gradientColor1: parsedDesignFields?.gradientColor1,
    gradientColor2: parsedDesignFields?.gradientColor2,
    borderSize: parsedDesignFields?.borderSize,
    borderColor: parsedDesignFields?.borderColor,
    spacingIT: parsedDesignFields?.spacingIT,
    spacingIB: parsedDesignFields?.spacingIB,
    spacingOT: parsedDesignFields?.spacingOT,
    spacingOB: parsedDesignFields?.spacingOB,
    borderRadius: parsedDesignFields?.borderRadius,
    preorderMessageColor: parsedDesignFields?.preorderMessageColor,
    buttonFontSize: parsedDesignFields?.buttonFontSize,
    buttonTextColor: parsedDesignFields?.buttonTextColor,
  });
  const [saveBarActive, setSaveBarActive] = useState(false);

  const [activeButtonIndex, setActiveButtonIndex] = useState(-1);
  const [discountType, setDiscountType] = useState(
    parsedCampaignData?.discount_type,
  );
  useEffect(() => {
    if (discountType === "percentage") {
      setActiveButtonIndex(0);
    } else if (discountType === "fixed") {
      setActiveButtonIndex(1);
    }
  }, [discountType]);

  const [discountPercentage, setDiscountPercentage] = useState(
    Number(parsedCampaignData?.discountpercent),
  );
  const [flatDiscount, setFlatDiscount] = useState(
    Number(parsedCampaignData?.discountfixed),
  );
  const handleCampaignEndDateChange = useCallback((range) => {
    setCampaignEndPicker((prev) => ({
      ...prev,
      selected: range,
      inputValue:
        range && range.start
          ? range.start.toLocaleDateString()
          : prev.inputValue,
      popoverActive: false,
    }));
    if (range && range.start) {
      setCampaignEndDate(range.start);
    }
  }, []);

  const handleCampaignEndMonthChange = useCallback((newMonth, newYear) => {
    setCampaignEndPicker((prev) => ({
      ...prev,
      month: newMonth,
      year: newYear,
    }));
  }, []);

  const toggleCampaignEndPopover = useCallback(
    () =>
      setCampaignEndPicker((prev) => ({
        ...prev,
        popoverActive: !prev.popoverActive,
      })),
    [],
  );

  const handleCampaignEndTimeChange = useCallback((value) => {
    setCampaignEndTime(value);
  }, []);

  async function fetchProductsInCollection(id: string) {
    submit(
      { intent: "fetchProductsInCollection", collectionId: id },
      { method: "get" },
    );

    if (prod) {
      setSelectedProducts(prod);
    }
  }

  const openResourcePicker = () => {
    shopify.modal.hide("my-modal");
    const picker = ResourcePicker.create(appBridge, {
      resourceType:
        productRadio === "option1"
          ? ResourcePicker.ResourceType.Product
          : ResourcePicker.ResourceType.Collection,
      options: {
        selectMultiple: true,
        initialSelectionIds: selectedProducts.map((v) => ({
          id: v.productId,
          variants: [{ id: v.variantId }],
        })),
      },
    });

    picker.subscribe(ResourcePicker.Action.SELECT, async (payload) => {
      if (productRadio === "option1") {
        // ✅ products directly selected
        const products = payload.selection.flatMap((p: any) =>
          p.variants.map((v: any) => ({
            productId: p.id,
            productImage: p.images?.[0]?.originalSrc,
            variantId: v.id,
            variantTitle: v.displayName,
            variantPrice: v.price,
            variantInventory: v.inventoryQuantity,
            maxUnit:
              selectedProducts.find((p) => p.variantId === v.id)?.maxUnit || 0,
          })),
        );
        setSelectedProducts(products);
      } else {
        // ✅ collections selected → fetch products inside
        let allProducts: any[] = [];

        for (const collection of payload.selection) {
          const productsInCollection = await fetchProductsInCollection(
            collection.id,
          );
          allProducts = [...allProducts, ...productsInCollection];
        }

        // remove duplicates by product id
        const uniqueProducts = Array.from(
          new Map(allProducts.map((p) => [p.id, p])).values(),
        );

        setSelectedProducts(uniqueProducts);
      }
    });

    picker.dispatch(ResourcePicker.Action.OPEN);
  };

  const togglePopover = useCallback(
    () => setPopoverActive((active) => !active),
    [],
  );

  const handleMonthChange = useCallback((newMonth :any, newYear:any) => {
    setMonthYear({ month: newMonth, year: newYear });
  }, []);

  const handleDateChange = useCallback((range:any) => {
    setSelectedDates(range);
    if (range && range.start) {
      setDueDateInputValue(range.start.toLocaleDateString());
    }
    setPopoverActive(false);
  }, []);

  const tabs = [
    {
      id: "content",
      content: "Content",
      panelID: "content-content",
    },
    {
      id: "design",
      content: "Design",
      panelID: "design-content",
    },
    {
      id: "add-products",
      content: "Products",
      panelID: "add-products-content",
    },
  ];

  const filteredProducts = selectedProducts?.filter((product:any) =>
    product.variantTitle?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleRemoveProduct(id: string) {
    // if (selectedProducts.length === 0) return; // do nothing if empty
    setSelectedProducts((prev:any) =>
      prev.filter((product:any) => product.variantId !== id),
    );
    setRemovedVarients((prev) => [...prev, id]);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && productTagInput.trim() !== "") {
      setProductTags((prev) => [...prev, productTagInput.trim()]);
      setProductTagInput("");
      event.preventDefault();
    }
  };

  const handleSubmit = () => {
   
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("intent", "update-campaign");
    formData.append("name", campaignName!);
    formData.append("depositPercent", String(partialPaymentPercentage));
    formData.append("balanceDueDate", DueDateinputValue);
    formData.append("refundDeadlineDays", "0");
    formData.append("campaignEndDate", campaignEndDate?.toISOString() ?? "");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("campaignType", String(selectedOption));
    formData.append("buttonText", String(buttonText));
    formData.append("shippingMessage", String(shippingMessage));
    formData.append("paymentMode", String(paymentMode));
    formData.append("designFields", JSON.stringify(designFields));
    formData.append("campaignType", String(selectedOption));
    submit(formData, { method: "post" });
  };

  const handleMaxUnitChange = (id: string, value: number) => {
    //if value is alphabet dont get typed
    if (isNaN(value)) return;
    setSelectedProducts((prev: any) =>
      prev.map((product:any) =>
        product.variantId === id
          ? { ...product, maxUnit: value } 
          : product,
      ),
    );
  };

  const appBridge = useAppBridge();

  async function handleDelete(id: string) {
    const formData = new FormData();
    formData.append("intent", "unpublish-campaign");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("secondaryIntent", "delete-campaign");
    formData.append("id", id);

    submit(formData, { method: "post" });
  }


  function handleUnpublish(id: string): void {
    setButtonLoading((prev) => ({ ...prev, publish: true }));
    const formData = new FormData();
    setIsSubmitting(true);
    formData.append("intent", "unpublish-campaign");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("id", id);

    submit(formData, { method: "post" });
  }

  function handleCriticalChange(id: string): void {
    const formData = new FormData();
    formData.append("intent", "unpublish-campaign");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("removedVarients", JSON.stringify(removedVarients));
    formData.append("secondaryIntent", "delete-campaign-create-new");
    formData.append("id", id);
    formData.append("name", String(campaignName));
    formData.append("depositPercent", String(partialPaymentPercentage));
    formData.append("balanceDueDate", DueDateinputValue);
    formData.append("refundDeadlineDays", "0");
    formData.append(
      "campaignEndDate",
      campaignEndDate ? campaignEndDate.toISOString() : "",
    );
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("campaignType", String(selectedOption));
    formData.append("buttonText", String(buttonText));
    formData.append("shippingMessage", String(shippingMessage));
    formData.append("paymentMode", String(paymentMode));
    formData.append("designFields", JSON.stringify(designFields));
    formData.append("discountType", discountType);
    formData.append("discountPercentage", String(discountPercentage));
    formData.append("flatDiscount", String(flatDiscount));
    formData.append("orderTags", JSON.stringify(productTags));
    formData.append("customerTags", JSON.stringify(customerTags));
    formData.append("campaignType", String(selectedOption));

    submit(formData, { method: "post" });
  }

  const handleSave = async () => {
    try {
      if (criticalChange === true) {
        await handleCriticalChange(String(campaign?.id));
      } else {
        await handleSubmit();
      }

      shopify.saveBar.hide("my-save-bar");
      setSaveBarActive(false);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDiscard = () => {
    // console.log("Discarding");
    shopify.saveBar.hide("my-save-bar");
    setSaveBarActive(false);
  };

  function handlePublish(id: string): void {
    setButtonLoading((prev) => ({ ...prev, publish: true }));
    const formData = new FormData();
    setIsSubmitting(true);
    formData.append("intent", "publish-campaign");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("paymentMode", String(paymentMode));
    formData.append("depositPercent", String(partialPaymentPercentage));
    formData.append("discountType", discountType);
    formData.append("discountPercentage", String(discountPercentage));
    formData.append("flatDiscount", String(flatDiscount));
    formData.append("orderTags", JSON.stringify(productTags));
    formData.append("customerTags", JSON.stringify(customerTags));
    formData.append("id", id);

    submit(formData, { method: "post" });
  }

  useEffect(() => {
    shopify.saveBar.show("my-save-bar");
    setSaveBarActive(true);
  }, [
    designFields,
    campaignName,
    selectedProducts,
    paymentMode,
    partialPaymentPercentage,
    DueDateinputValue,
    selectedOption,
    buttonText,
    shippingMessage,
    productTags,
    customerTags,
    campaignEndDate,
    discountType,
    discountPercentage,
    flatDiscount,
    removedVarients,
  ]);

  useEffect(() => {
    setSaveBarActive(false);
  }, []);

  const handleButtonClick = useCallback(
    (index: number) => {
      if (activeButtonIndex === index) return;
      setActiveButtonIndex(index);
      setDiscountType(index === 0 ? "percentage" : "flat");
    },
    [activeButtonIndex],
  );

  const handleKeyDownCustomerTag = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && customerTagInput.trim() !== "") {
      setCustomerTags((prev) => [...prev, customerTagInput.trim()]);
      setCustomerTagInput("");
      event.preventDefault();
    }
  };

  function handleRemoveTag(index: number): void {
    const updatedTags = [...productTags];
    updatedTags.splice(index, 1);
    setProductTags(updatedTags);
  }

  function handleRemoveCustomerTag(index: number) {
    const updatedTags = [...customerTags];
    updatedTags.splice(index, 1);
    setCustomerTags(updatedTags);
  }

  useEffect(() => {
    if (criticalChange === false) {
      setCriticalChange(true);
    }
  }, [
    discountType,
    discountPercentage,
    flatDiscount,
    paymentMode,
    partialPaymentPercentage,
    DueDateinputValue,
  ]);

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title={`Update ${campaignName}`}
        titleMetadata={
          campaign?.status === "PUBLISHED" ? (
            <Badge tone="success">Published</Badge>
          ) : (
            <Badge tone="info">Not published</Badge>
          )
        }
        backAction={{
          content: "Back",
          onAction: () => {
            console.log(saveBarActive);
            if (saveBarActive) {
              shopify.saveBar.leaveConfirmation();

            } else {
              navigate("/app");
            }
          }, 
        }}
        primaryAction={{
          content: campaign?.status === "PUBLISHED" ? "Unpublish" : "Publish",
          loading: buttonLoading.publish,
          onAction: () =>
            campaign?.status === "PUBLISHED"
              ? handleUnpublish(String(campaign?.id))
              : handlePublish(String(campaign?.id)),
        }}
        secondaryActions={[
          {
            content: "Delete",
            destructive: true,
            onAction: () => shopify.modal.show("delete-modal"),
            loading: buttonLoading.delete,
          },
        ]}
      >
        <SaveBar id="my-save-bar">
          <button variant="primary" onClick={handleSave}></button>
          <button onClick={handleDiscard}></button>
        </SaveBar>
        <Modal id="delete-modal">
          <p style={{ padding: "10px" }}>
            Delete "{campaign?.name}" This will also remove the campaign from
            your Shopify store and can’t be undone.
          </p>
          <TitleBar title={`Delete ${campaign?.name}?`}>
            <button
              variant="primary"
              tone="critical"
              onClick={() => {
                setButtonLoading((prev) => ({ ...prev, delete: true }));
                handleDelete(String(campaign?.id));
                shopify.modal.hide("delete-modal");
              }}
              loading={buttonLoading.delete}
            >
              Delete
            </button>
            <button onClick={() => {shopify.modal.hide("delete-modal")}}>
              Cancel
            </button>
          </TitleBar>
        </Modal>
        <Tabs tabs={tabs} selected={selected} onSelect={setSelected} />

        <form method="post" onSubmit={handleSubmit}>
          <input type="hidden" name="intent" value="create-campaign" />
          <input
            type="hidden"
            name="products"
            value={JSON.stringify(selectedProducts)}
          />
          <input type="hidden" name="name" value={campaignName} />
          <input
            type="hidden"
            name="depositPercent"
            value={String(partialPaymentPercentage)}
          />
          <input
            type="hidden"
            name="balanceDueDate"
            value={DueDateinputValue}
          />
          <input type="hidden" name="refundDeadlineDays" value="0" />
          <input
            type="hidden"
            name="campaignEndDate"
            value={campaignEndDate ? campaignEndDate.toISOString() : ""}
          />
          <input
            type="hidden"
            name="designFields"
            value={JSON.stringify(designFields)}
          />

          <div
            style={{
              display: "flex",
              position: "relative",
              paddingBottom: 20,
              paddingTop: 20,
            }}
          >
            {/* left */}
            {selected === 0 && (
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack>
                    <Text as="h1" variant="headingLg">
                    </Text>
                  </BlockStack>
                  <TextField
                    id="campaignName"
                    label="Campaign Name"
                    placeholder="Enter campaign name"
                    autoComplete="off"
                    value={campaignName}
                    onChange={setCampaignName}
                  />
                  <div style={{ marginTop: 6 }}>
                    <p>This is only visible for you</p>
                  </div>
                  <div>
                    <Text as="h4" variant="headingSm">
                      Preorder
                    </Text>
                  </div>
                  <LegacyStack vertical>
                    <RadioButton
                      label="Show Preorder when product is out of stock"
                      checked={selectedOption === 1}
                      id="preorder"
                      name="preorder"
                      onChange={() => {
                        setSelectedOption(1);
                      }}
                    />
                    {selectedOption === 1 && (
                      <ol>
                        <li>
                          The Preorder button appears when stock reaches 0 and
                          switches to "Add to cart" once inventory is
                          replenished.
                        </li>
                        <li>
                          When the campaign is active, the app enables "Continue
                          selling when out of stock" and "Track quantity".
                        </li>
                      </ol>
                    )}
                    <RadioButton
                      label="Always show Preorder button"
                      checked={selectedOption === 2}
                      id="always-preorder"
                      name="always-preorder"
                      onChange={() => {
                        setSelectedOption(2);
                      }}
                    />
                    {selectedOption === 2 && (
                      <Text as="p">
                        Preorder lets customers buy before stock is available.
                      </Text>
                    )}
                    <RadioButton
                      label="Show Preorder only when product in stock"
                      checked={selectedOption === 3}
                      id="back-in-stock"
                      name="back-in-stock"
                      onChange={() => {
                        setSelectedOption(3);
                      }}
                    />
                    {selectedOption === 3 && (
                      <Text>
                        Preorder lets customers buy before stock is available.
                      </Text>
                    )}
                  </LegacyStack>
                  {/* </div> */}
                </Card>

                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Text as="h4" variant="headingSm">
                      Preorder Button
                    </Text>
                    <TextField
                      id="preorderButtonText"
                      label="Button Text"
                      placeholder="Enter button text"
                      autoComplete="off"
                      value={buttonText}
                      onChange={(e) => setButtonText(e)}
                    />
                    <TextField
                      id="preorderMessage"
                      label="Message"
                      placeholder="Enter message"
                      value={shippingMessage}
                      onChange={(e) => setShippingMessage(e)}
                      autoComplete="off"
                    />
                  </Card>
                </div>

                {/* discount */}
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <BlockStack gap={"300"}>
                      <Text as="h4" variant="headingSm">
                        Discount
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Only works with{" "}
                        <Link to="https://help.shopify.com/en/manual/payments/shopify-payments">
                          Shopify Payments
                        </Link>{" "}
                      </Text>
                      <InlineStack gap="400">
                        <ButtonGroup variant="segmented">
                          <Button
                            pressed={activeButtonIndex === 0}
                            onClick={() => handleButtonClick(0)}
                            icon={DiscountIcon}
                          ></Button>
                          <Button
                            pressed={activeButtonIndex === 1}
                            onClick={() => handleButtonClick(1)}
                            icon={CashDollarIcon}
                          ></Button>
                        </ButtonGroup>
                        <TextField
                          suffix={activeButtonIndex === 0 ? "%" : "$"}
                          id="discount"
                          type="number"
                          value={
                            activeButtonIndex === 0
                              ? discountPercentage
                              : flatDiscount
                          }
                          onChange={(val) => {
                            if (activeButtonIndex === 0) {
                              setDiscountPercentage(Number(val));
                            } else {
                              setFlatDiscount(Number(val));
                            }
                          }}
                        />
                      </InlineStack>
                      {(activeButtonIndex === 0 && discountPercentage < 0) ||
                      discountPercentage >= 100 ? (
                        <Text as="p" variant="bodyMd" tone="critical">
                          Please enter valid discount percentage between 0 and
                          99
                        </Text>
                      ) : null}

                      <Text as="p" variant="bodyMd">
                        Can't see discount/strike through price?{" "}
                        <Link to="https://help.shopify.com/en/manual/payments/shopify-payments">
                          Contact support
                        </Link>
                      </Text>
                    </BlockStack>
                  </Card>
                </div>

                {/* preorder Note */}
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Text as="h4" variant="headingSm">
                      Preorder note
                    </Text>
                    <p>Visible in cart, checkout, transactional emails</p>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <TextField
                        id="preorderNote"
                        label="Preorder Note Key"
                        autoComplete="off"
                        value={preOrderNoteKey}
                        onChange={setPreOrderNoteKey}
                      />
                      <TextField
                        id="preorderNote"
                        label="Preorder Note Key"
                        autoComplete="off"
                        value={preOrderNoteValue}
                        onChange={setPreOrderNoteValue}
                      />
                    </div>
                  </Card>
                </div>

                {/* payment type */}
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Text as="h4" variant="headingSm">
                      Payment
                    </Text>
                    <div>
                      <LegacyStack vertical>
                        <RadioButton
                          label="Full payment"
                          checked={paymentMode === "full"}
                          id="full-payment"
                          name="full-payment"
                          onChange={() => setPaymentMode("full")}
                        />
                        {paymentMode === "full" && (
                          <>
                            <TextField
                              id="fullPaymentNote"
                              autoComplete="off"
                              label="Full payment text"
                              value="Pay in Full"
                            />
                            <Text as="p" variant="bodyMd">
                              Visible in cart, checkout, transactional emails
                            </Text>
                          </>
                        )}
                        <RadioButton
                          label="Partial payment"
                          id="partial-payment"
                          name="partial-payment"
                          checked={paymentMode === "partial"}
                          onChange={() => setPaymentMode("partial")}
                        />
                        {paymentMode === "partial" && (
                          <div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <div>
                                <ButtonGroup variant="segmented">
                                  <Button
                                    pressed={partialPaymentType === "percent"}
                                    onClick={() =>
                                      setPartialPaymentType("percent")
                                    }
                                    icon={DiscountIcon}
                                  ></Button>
                                  {/* <Button
                                        pressed={partialPaymentType === "flat"}
                                        onClick={() => setPartialPaymentType("flat")}
                                        icon={CashDollarFilledIcon}
                                        aria-label="Flat payment"
                                      ></Button> */}
                                </ButtonGroup>
                              </div>
                              <div style={{ flex: 1 }}>
                                <TextField
                                  autoComplete="off"
                                  suffix={` ${partialPaymentType === "percent" ? "%" : "$"}`}
                                  value={String(partialPaymentPercentage)}
                                  onChange={setPartialPaymentPercentage}
                                />
                              </div>
                            </div>
                            <div
                              style={{
                                marginTop: 10,
                                display: "flex",
                                gap: 10,
                              }}
                            >
                              <div>
                                <ButtonGroup variant="segmented">
                                  {/* <Button
                                        pressed={duePaymentType === 1}
                                        onClick={() => setDuePaymentType(1)}
                                        icon={ClockIcon}
                                      ></Button> */}
                                  <Button
                                    pressed={duePaymentType === 2}
                                    onClick={() => setDuePaymentType(2)}
                                    icon={CalendarCheckIcon}
                                  ></Button>
                                </ButtonGroup>
                              </div>
                              <div style={{ flex: 1 }}>
                                {duePaymentType === 1 && (
                                  <TextField
                                    id="partialPaymentNote"
                                    autoComplete="off"
                                    suffix="days after checkout"
                                  />
                                )}
                                {duePaymentType === 2 && (
                                  <div>
                                    <Popover
                                      active={popoverActive}
                                      activator={
                                        <div style={{ flex: 1 }}>
                                          <TextField
                                            label="Select date for due payment"
                                            value={DueDateinputValue}
                                            onFocus={togglePopover}
                                            onChange={() => {}}
                                            autoComplete="off"
                                          />
                                        </div>
                                      }
                                      onClose={() => setPopoverActive(false)}
                                    >
                                      <DatePicker
                                        month={month}
                                        year={year}
                                        onChange={handleDateChange}
                                        onMonthChange={handleMonthChange}
                                        selected={selectedDates}
                                      />
                                    </Popover>
                                  </div>
                                )}
                              </div>
                            </div>
                            <TextField
                              autoComplete="off"
                              label="Partial payment text"
                              onChange={setPartialPaymentText}
                              value={partialPaymentText}
                            />
                            <Text as="p" variant="bodyMd">
                              Visible in cart, checkout, transactional emails
                            </Text>
                            <div>
                              <TextField
                                autoComplete="off"
                                label="Text"
                                value={partialPaymentInfoText}
                              />
                              <Text as="p" variant="bodyMd">
                                Use {"{payment}"} and {"{remaining}"} to display
                                partial payment amounts and {"{date}"} for full
                                amount charge date.
                              </Text>
                            </div>
                          </div>
                        )}
                      </LegacyStack>
                    </div>
                  </Card>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Text as="h4" variant="headingSm">
                      Campaign End Date and Time
                    </Text>
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <div style={{ flex: 1 }}>
                        <Popover
                          active={campaignEndPicker.popoverActive}
                          activator={
                            <div style={{ flex: 1 }}>
                              <TextField
                                label="Select end date"
                                value={campaignEndPicker.inputValue}
                                onFocus={toggleCampaignEndPopover}
                                onChange={() => {}}
                                autoComplete="off"
                              />
                            </div>
                          }
                          onClose={toggleCampaignEndPopover}
                        >
                          <DatePicker
                            month={campaignEndPicker.month}
                            year={campaignEndPicker.year}
                            onChange={handleCampaignEndDateChange}
                            onMonthChange={handleCampaignEndMonthChange}
                            selected={campaignEndPicker.selected}
                          />
                        </Popover>
                      </div>
                      <div>
                        <TextField
                          id="campaignEndTime"
                          autoComplete="off"
                          type="time"
                          label="Time"
                          placeholder="Select time"
                          value={campaignEndTime}
                          onChange={handleCampaignEndTimeChange}
                        />
                      </div>
                    </div>
                    <Text as="p" variant="bodyMd">
                      Campaign will end at the selected date and time.
                    </Text>
                  </Card>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <BlockStack gap={"200"}>
                      <Text as="h4" variant="headingSm">
                        Order tags
                      </Text>
                      <div onKeyDown={handleKeyDown}>
                        <TextField
                          label="Order Tags"
                          value={productTagInput}
                          onChange={(value) => setProductTagInput(value)} // Polaris style
                          autoComplete="off"
                        />
                      </div>
                      <Text as="h4" variant="headingSm">
                        For customers who placed preorders
                      </Text>
                      <div>
                        {productTags.map((tag, index) => (
                          <div key={index} style={{ display: "inline-block" }}>
                            <span
                              key={index}
                              style={{
                                marginRight: 5,
                                backgroundColor: "gray",
                                padding: 5,
                                borderRadius: 5,
                                position: "relative",
                              }}
                            >
                              {tag}
                              <button
                                style={{
                                  backgroundColor: "gray",
                                  padding: 5,
                                  border: "none",
                                }}
                                onClick={() => handleRemoveTag(index)}
                              >
                                X
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </BlockStack>
                  </Card>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <BlockStack gap={"200"}>
                      <Text as="h4" variant="headingSm">
                        Customer tags
                      </Text>
                      <div onKeyDown={handleKeyDownCustomerTag}>
                        <TextField
                          label="Customer Tags"
                          value={customerTagInput}
                          onChange={(value) => setCustomerTagInput(value)} // Polaris style
                          autoComplete="off"
                        />
                      </div>
                      <Text as="h4" variant="headingSm">
                        For customers who placed preorders
                      </Text>
                      <div>
                        {customerTags.map((tag, index) => (
                          <div key={index} style={{ display: "inline-block" }}>
                            <span
                              key={index}
                              style={{
                                marginRight: 5,
                                backgroundColor: "gray",
                                padding: 5,
                                borderRadius: 5,
                                position: "relative",
                              }}
                            >
                              {tag}
                              <button
                                style={{
                                  backgroundColor: "gray",
                                  padding: 5,
                                  border: "none",
                                }}
                                onClick={(key) => {
                                  handleRemoveCustomerTag(index);
                                }}
                              >
                                X
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </BlockStack>
                  </Card>
                </div>
              </div>
            )}
            {selected === 1 && (
              <div style={{ flex: 1 }}>
                <PreviewDesign
                  designFields={designFields}
                  setDesignFields={setDesignFields}
                  setTabSelected={setSelected}
                />
              </div>
            )}

            {/* right */}
            {(selected === 0 || selected === 1) && (
              <div style={{ flex: 1, marginLeft: 20 }}>
                {/* preview */}
                <div style={{ position: "sticky", top: 20 }}>
                  <Card>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Text as="h4" variant="headingSm">
                        Preview
                      </Text>
                    </div>
                    <div style={{}}>
                      <Text as="h1" variant="headingLg">
                        White T-shirt
                      </Text>
                      <div style={{ marginTop: 10 }}>
                        <InlineStack gap="200">
                          <Text as="h1" variant="headingMd">
                            {discountPercentage === 0 && flatDiscount === 0 ? (
                              <Text as="h1" variant="headingLg">
                                $499.00
                              </Text>
                            ) : (
                              <Text as="h1" variant="headingLg">
                                {activeButtonIndex === 0 &&
                                discountPercentage !== 0
                                  ? "$" +
                                    (
                                      499.0 -
                                      (499.0 * discountPercentage) / 100
                                    ).toFixed(2)
                                  : 499.0 - flatDiscount > 0
                                    ? "$" + (499.0 - flatDiscount)
                                    : "$" + 0}
                              </Text>
                            )}
                          </Text>
                          {discountPercentage === 0 &&
                          flatDiscount === 0 ? null : (
                            <Text
                              as="h1"
                              variant="headingMd"
                              textDecorationLine="line-through"
                            >
                              $499.00
                            </Text>
                          )}
                        </InlineStack>
                      </div>
                    </div>
                    <div style={{ marginTop: 20 }}>
                      <Text as="h1" variant="headingSm">
                        Size
                      </Text>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div
                          style={{
                            border: "1px solid black",
                            borderRadius: 80,
                            padding: 2,
                            minWidth: "60px",
                            textAlign: "center",
                          }}
                        >
                          Small
                        </div>
                        <div
                          style={{
                            border: "1px solid black",
                            borderRadius: 80,
                            padding: 3,
                            backgroundColor: "black",
                            minWidth: "60px",
                          }}
                        >
                          <span style={{ color: "white", textAlign: "center" }}>
                            Medium
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: designFields.spacingOT + "px",
                        marginBottom: designFields.spacingOB + "px",
                      }}
                    >
                      <div
                        style={{
                          // height: 50,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor:
                            designFields?.buttonStyle === "single"
                              ? designFields?.buttonBackgroundColor
                              : "black",
                          background:
                            designFields?.buttonStyle === "gradient"
                              ? `linear-gradient(${designFields?.gradientDegree}deg, ${designFields?.gradientColor1}, ${designFields?.gradientColor2})`
                              : designFields?.buttonBackgroundColor,
                          borderRadius: designFields.borderRadius + "px",
                          // marginTop: "auto",
                          borderColor: designFields.borderColor,
                          borderWidth: designFields.borderSize + "px",
                          borderStyle: "solid",
                          paddingTop: designFields.spacingIT + "px",
                          paddingBottom: designFields.spacingIB + "px",
                        }}
                      >
                        <span
                          style={{
                            color: designFields.buttonTextColor,
                            fontWeight: "bold",
                            fontSize: designFields.buttonFontSize + "px",
                          }}
                        >
                          {buttonText}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: 5,
                      }}
                    >
                      <Text as="h1" variant="headingMd">
                        <h3
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            fontFamily:
                              designFields.fontFamily !== ""
                                ? designFields.fontFamily
                                : "Helvetica Neue",
                            fontSize:
                              designFields.messageFontSize !== ""
                                ? designFields.messageFontSize + "px"
                                : "16px",
                            color: designFields.preorderMessageColor,
                          }}
                        >
                          {shippingMessage}
                        </h3>
                      </Text>
                    </div>
                    {paymentMode === "partial" && (
                      <div
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <Text as="h1" variant="headingMd">
                          Pay $3.92 now and $35.28 will be charged on{" "}
                          {DueDateinputValue}
                        </Text>
                      </div>
                    )}
                  </Card>
                  <div style={{ marginTop: 20 }}>
                    <Card>
                      <div style={{ padding: 3, textAlign: "center" }}>
                        <Text as="p" variant="headingSm">
                          CART, CHECKOUT, EMAIL PREVIEW
                        </Text>
                      </div>
                      <div style={{ display: "flex", gap: 25 }}>
                        <div>
                          <img
                            src="https://essential-preorder.vercel.app/images/placeholder-preorder-product-img.jpg"
                            alt=""
                            height={80}
                          />
                        </div>
                        <div>
                          <p style={{ fontWeight: "bold", fontSize: "16px" }}>
                            Baby Pink T-shirt
                          </p>
                          {paymentMode === "partial" ? (
                            <p>Partial payment</p>
                          ) : (
                            <p>Pay in full</p>
                          )}
                          <p>
                            {preOrderNoteKey} : {preOrderNoteValue}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {selected === 2 && (
          <div>
            {selectedProducts.length === 0 && (
              <div>
                <Card padding={"3200"}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <Text as="p" variant="headingSm">
                        Add products to Preorder
                      </Text>
                    </div>
                    <div>
                      <Text as="p" variant="bodySm">
                        Products and variants that are added will be prepared
                        for preorder after the campaign is published
                      </Text>
                    </div>
                    <div>
                      <ButtonGroup>
                        <Button onClick={() => shopify.modal.show("my-modal")}>
                          Add Specific Product
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            // setProductAddType("all")
                            selectAllProducts();
                          }}
                        >
                          Add all products
                        </Button>
                      </ButtonGroup>
                    </div>
                  </div>
                </Card>
                <div style={{ marginTop: 20 }}>
                  <Banner
                    title="Product inventory settings updates"
                    tone="info"
                  >
                    <p>
                      <strong>
                        “Continue selling when out of stock”, “Track quantity”
                      </strong>{" "}
                      are enabled for products above. After campaign is
                      published, we continuously monitor products to ensure they
                      always comply with campaign conditions.
                    </p>
                  </Banner>
                </div>
              </div>
            )}
            {selectedProducts.length > 0 && (
              <Card title="Selected Products">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                  }}
                >
                  <div>
                    <TextField
                      // label="Search products"
                      value={searchTerm}
                      onChange={setSearchTerm}
                      autoComplete="off"
                      placeholder="Search by product name"
                    />
                  </div>
                  <div>
                    <ButtonGroup>
                      <Button onClick={openResourcePicker}>
                        Add More Products
                      </Button>
                      <Button
                        onClick={() => {
                          setRemovedVarients([
                            ...removedVarients,
                            ...selectedProducts.map((p) => p.variantId),
                          ]);
                          setSelectedProducts([]);
                        }}
                      >
                        Remove all Products
                      </Button>
                    </ButtonGroup>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Image
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Product
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Inventory
                        </th>
                        {selectedOption !== 3 && <th
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Inventory limit
                        </th>}
                        <th
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Price
                        </th>
                        <th
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        ></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.varientId}>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                              textAlign: "center",
                            }}
                          >
                            <img
                              src={product.productImage}
                              alt={product.variantTitle}
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                              }}
                            />
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                              textAlign: "center",
                            }}
                          >
                            {product.variantTitle !== "Default Title"
                              ? product.variantTitle
                              : product.productTitle}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                              textAlign: "center",
                            }}
                          >
                            {product.variantInventory
                              ? product.variantInventory
                              : product.inventory}
                          </td>
                          {
                            selectedOption !== 3 && (
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                width: "100px",
                                textAlign: "center",
                              }}
                            >
                              <TextField
                                type="text"
                                min={0}
                                value={
                                  selectedOption === 3
                                    ? product.variantInventory
                                      ? product.variantInventory
                                      : product.inventory
                                    : product?.maxUnit.toString() || "0"
                                }
                                onChange={(value) =>
                                  handleMaxUnitChange(
                                    product.variantId,
                                    Number(value),
                                  )
                                }
                              />
                            </td>
                            )
                          }
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                              textAlign: "center",
                            }}
                          >
                            ${product.variantPrice}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            <div
                              onClick={() => {
                                handleRemoveProduct(product.variantId);
                              }}
                            >
                              <Icon source={DeleteIcon} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            <Modal id="my-modal">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 10,
                }}
              >
                <div>
                  <RadioButton
                    label="specific Product"
                    checked={productRadio === "option1"}
                    id="option1"
                    onChange={() => setproductRadio("option1")}
                  />
                </div>

                <div>
                  <RadioButton
                    label="Collection"
                    checked={productRadio === "option2"}
                    id="option2"
                    onChange={() => setproductRadio("option2")}
                  />
                </div>
              </div>
              <TitleBar title="Add products">
                <button variant="primary" onClick={openResourcePicker}>
                  Continue
                </button>
                <button onClick={() => shopify.modal.hide("my-modal")}>
                  Cancel
                </button>
              </TitleBar>
            </Modal>
          </div>
        )}
      </Page>
    </AppProvider>
  );
}
