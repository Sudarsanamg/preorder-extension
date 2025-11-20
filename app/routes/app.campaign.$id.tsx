import {
  deleteCampaign,
  getCampaignById,
  getCampaignStatus,
  getStoreIdByShopId,
  replaceProductsInCampaign,
  updateCampaign,
  updateCampaignStatus,
} from "../models/campaign.server";
import { useState, useCallback, useEffect, useRef } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json,  } from "@remix-run/node";
import {
  AppProvider,
  Button,
  ButtonGroup,
  Text,
  TextField,
  Page,
  RadioButton,
  Card,
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
  // useNavigation,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import { DeleteIcon } from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ResourcePicker } from "@shopify/app-bridge/actions";
import { useAppBridge } from "../components/AppBridgeProvider";
import { Modal, TitleBar, SaveBar } from "@shopify/app-bridge-react";
import type { CampaignFields, DesignFields } from "app/types/type";
import PreviewDesign from "app/components/PreviewDesign";
import prisma from "app/db.server";
import {
  removeMetaFieldMutation,
  SET_PREORDER_METAFIELDS,
} from "app/graphql/mutation/metafields";
import { createSellingPlan } from "app/services/sellingPlan.server";
import { unpublishMutation } from "app/graphql/mutation/metaobject";
import {
  GET_PRODUCTS_WITH_PREORDER_WITH_ID,
  GET_VARIENT_BY_IDS,
} from "app/graphql/queries/products";
import { fetchMetaobject } from "app/services/metaobject.server";
import {
  allowOutOfStockForVariants,
  DELETE_SELLING_PLAN_GROUP,
  GET_VARIANT_SELLING_PLANS,
  removeVariantMutation,
} from "app/graphql/mutation/sellingPlan";
import {
  GetCampaignId,
  publishMutation,
  updateCampaignDataMutation,
} from "app/graphql/queries/metaobject";
import {
  GET_COLLECTION_PRODUCTS,
  GET_SHOP,
  isShopifyPaymentsEnabled,
} from "app/graphql/queries/shop";
import { GET_PRODUCT_SELLING_PLAN_GROUPS } from "app/graphql/queries/sellingPlan";
import type {
  CampaignStatus,
  CampaignType,
  DiscountType,
  Fulfilmentmode,
  scheduledFulfilmentType,
} from "@prisma/client";
import { formatDate } from "app/utils/formatDate";
import CampaignForm from "app/components/CampaignForm";
import { isStoreRegistered } from "app/helper/isStoreRegistered";
import { formatCurrency } from "app/helper/currencyFormatter";
import {
  CampaignSchema,
  DesignSchema,
} from "app/utils/validator/zodValidateSchema";
import { PreviewComponent } from "app/components/PreviewComponent";
import "../styles/campaign.new.css";
import { removeProductsFromOldCampagin } from "app/helper/campaignHelper";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  const shop = session.shop;
  const isStoreExist = await isStoreRegistered(shop);
  if (!isStoreExist) {
    return Response.json(
      { success: false, error: "Store not found" },
      { status: 404 },
    );
  }
  if (intent === "fetchProductsInCollection") {
    const collectionId = url.searchParams.get("collectionId");

    try {
      const response = await admin.graphql(GET_COLLECTION_PRODUCTS, {
        variables: { id: collectionId },
      });
      const resData: any = (await response.json)
        ? await response.json()
        : response;

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
    const campaign = await getCampaignById(params.id!, shop);
    const varientId = campaign?.products?.map((p) => p.variantId) || [];
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
      "$app:preorder-extension",
    );
    let parsedCampaignSettingsResponse = await campaignSettingsResponse.json();
    const metaobject = parsedCampaignSettingsResponse.data.metaobjectByHandle;
    const objectField = metaobject?.fields.find((f: any) => f.key === "object");
    const parsedObject = JSON.parse(objectField?.value);
    parsedCampaignSettingsResponse = parsedObject?.campaignData;
    let parsedDesignSettingsResponse = parsedObject?.designFields;

    const products = variants.map((variant: any) => ({
      productId: variant.productId,
      variantId: variant.id,
      variantTitle: variant.title,
      variantPrice: variant.price,
      variantInventory: variant.inventory,
      maxUnit: variant.maxUnit,
      productImage: variant.image,
      productTitle: variant.productTitle,
    }));
    const shopDomain = session.shop;
    const shopResponse = await admin.graphql(GET_SHOP);
    const shopResponseData = await shopResponse.json();
    const shopId = shopResponseData.data.shop.id;

    const shopifyPaymentsEnabled = await isShopifyPaymentsEnabled(shopDomain);
    const storeId = await getStoreIdByShopId(shopId as string);
    const getDueByValtResponse = await prisma.store.findUnique({
      where: {
        id: storeId?.id,
      },
      select: {
        getDueByVault: true,
      },
    });

    return json({
      campaign,
      products,
      parsedDesignSettingsResponse,
      parsedCampaignSettingsResponse,
      shopifyPaymentsEnabled,
      getDueByValt: getDueByValtResponse?.getDueByVault,
    });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const response = await admin.graphql(GET_SHOP);
  const data = await response.json();
  const shopId = data.data.shop.id;
  const isStoreExist = await isStoreRegistered(shop);
  if (!isStoreExist) {
    return Response.json(
      { success: false, error: "Store not found" },
      { status: 404 },
    );
  }
  const store = await getStoreIdByShopId(shopId);
  const storeId = store?.id;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const secondaryIntent = formData.get("secondaryIntent") as string;
  const campaignCurrentStatusResponse = await getCampaignStatus(
    params.id!,
    storeId as string,
  );
  const campaignCurrentStatus = campaignCurrentStatusResponse?.status;
  if (intent === "productsWithPreorder") {
    let productIds = JSON.parse(formData.get("products") as string);

    const currentCampaignId = (formData.get("campaignId") as string) || null;

    productIds = productIds.map((product: any) => product.variantId);

    const response = await admin.graphql(GET_PRODUCTS_WITH_PREORDER_WITH_ID, {
      variables: { ids: productIds },
    });
    const data = await response.json();

    const productsWithPreorder = data.data.nodes.map((node: any) => {
      let assocCampaignId = node?.metafield?.value ?? null;
      if (assocCampaignId === "null") assocCampaignId = null;

      const associatedWithOtherCampaign =
        !!assocCampaignId && assocCampaignId !== currentCampaignId;

      return {
        id: node.id,
        title: node.title,
        associatedCampaignId: assocCampaignId,
        associatedWithOtherCampaign,
      };
    });

    return json({ productsWithPreorder });
  }
  if (intent === "update-campaign") {
    const products = JSON.parse((formData.get("products") as string) || "[]");
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
    
    await removeProductsFromOldCampagin(products,storeId)

    const campaign = await updateCampaign({
      id: params.id!,
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
      discountType: formData.get("discountType") as DiscountType,
      discountValue: Number(formData.get("discountValue") || "0"),
      campaignType: formData.get("campaignType") as CampaignType,
      shopId: shopId,
      status: campaignCurrentStatus,
      fulfilmentmode: formData.get("fulfilmentmode") as Fulfilmentmode,
      scheduledFulfilmentType: formData.get(
        "scheduledFulfilmentType",
      ) as scheduledFulfilmentType,
      fulfilmentDaysAfter: Number(formData.get("fulfilmentDaysAfter")),
      fulfilmentExactDate: new Date(
        formData.get("fulfilmentExactDate") as string,
      ),
      paymentType: formData.get("paymentMode") as string,
      campaignEndDate: new Date(formData.get("campaignEndDate") as string),
    });


    if (products.length > 0) {
      await replaceProductsInCampaign(
        String(params.id!),
        products,
        storeId as string,
        formData.get("campaignType") as CampaignType,
      );

      const campaignType = formData.get("campaignType") as CampaignType;

      const metafields = products.flatMap((product: any) => [
        {
          ownerId: product.variantId,
          namespace: "$app:preorder-extension",
          key: "campaign_id",
          type: "single_line_text_field",
          value: String(campaign.id),
        },
        {
          ownerId: product.productId,
          namespace: "$app:preorder-extension",
          key: "campaign_id",
          type: "single_line_text_field",
          value: String(campaign.id),
        },
        {
          ownerId: product.variantId,
          namespace: "$app:preorder-extension",
          key: "preorder",
          type: "boolean",
          value: "true",
        },
        {
          ownerId: product.variantId,
          namespace: "$app:preorder-extension",
          key: "preorder_end_date",
          type: "date_time",
          value: new Date(
            formData.get("campaignEndDate") as string,
          ).toISOString(),
        },
        {
          ownerId: product.variantId,
          namespace: "$app:preorder-extension",
          key: "deposit_percent",
          type: "number_integer",
          value: String(formData.get("depositPercent") || "0"),
        },
        {
          ownerId: product.variantId,
          namespace: "$app:preorder-extension",
          key: "balance_due_date",
          type: "date",
          value: new Date(
            formData.get("balanceDueDate") as string,
          ).toISOString(),
        },
        {
          ownerId: product.variantId,
          namespace: "$app:preorder-extension",
          key: "preorder_max_units",
          type: "number_integer",
          value:
            campaignType == "IN_STOCK"
              ? String(product.variantInventory)
              : String(product?.maxUnit || "0"),
        },
      ]);

      try {
        for (let i = 0; i < metafields.length; i += 20) {
          const batch = metafields.slice(i, i + 20);
          await admin.graphql(SET_PREORDER_METAFIELDS, {
            variables: { metafields: batch },
          });
        }
      } catch (err) {
        console.error("GraphQL mutation failed:", err);
        throw err;
      }
    }


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
      formData.get("campaignType") == "ALWAYS"
    ) {
      allowOutOfStockForVariants(admin, products);
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
            discount_type: formData.get("discountType") as DiscountType,
            discountValue: (formData.get("discountValue") as string) || "0",
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
                    ? 7
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

    const handleRes = await admin.graphql(GetCampaignId, {
      variables: {
        handle: { type: "$app:preorder-extension", handle: params.id },
      },
    });

    const handleData = await handleRes.json();
    const metaobjectId = handleData?.data?.metaobjectByHandle?.id;

    if (!metaobjectId) {
      throw new Error("Campaign metaobject not found for handle: " + params.id);
    }

    await admin.graphql(updateCampaignDataMutation, {
      variables: {
        id: metaobjectId,
        metaobjectUpdate: { fields: campaignFields },
      },
    });

    await updateCampaignStatus(
      campaign.id,
      campaignCurrentStatus as CampaignStatus,
      shopId,
    );
    const removedVarients = formData.get("removedVarients") as string;
    const parsedRemovedVarients = removedVarients
      ? JSON.parse(removedVarients)
      : [];

    if (parsedRemovedVarients.length > 0) {
      //need to remove selling group and
      //remove metafields
      for (const variantId of parsedRemovedVarients) {
        const { data }: any = await admin.graphql(GET_VARIANT_SELLING_PLANS, {
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
          namespace: "$app:preorder-extension",
          key: "campaign_id",
          type: "single_line_text_field",
          value: "null",
        },
        {
          ownerId: varientId,
          namespace: "$app:preorder-extension",
          key: "preorder",
          type: "boolean",
          value: "false",
        },
        {
          ownerId: varientId,
          namespace: "$app:preorder-extension",
          key: "campaign_id",
          type: "single_line_text_field",
          value: "null",
        },
        {
          ownerId: varientId,
          namespace: "$app:preorder-extension",
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

    // return redirect("/app");
    return Response.json(
      { success: true, error: null, message: "Campaign updated successfully" },
      { status: 200 },
    );
  }

  if (intent === "publish-campaign") {
    const id = formData.get("id");
    try {
      await admin.graphql(publishMutation, {
        variables: {
          handle: { type: "$app:preorder-extension", handle: id },
          status: "ACTIVE",
        },
      });
    } catch (error) {
      console.log(error);
    }

    const products = JSON.parse((formData.get("products") as string) || "[]");
    const campaignType = formData.get("campaignType") as CampaignType;
    const metafields = products.flatMap((product: any) => [
      {
        ownerId: product.variantId,
        namespace: "$app:preorder-extension",
        key: "campaign_id",
        value: id,
      },
      {
        ownerId: product.variantId,
        namespace: "$app:preorder-extension",
        key: "preorder",
        value: "true",
      },
      {
        ownerId: product.variantId,
        namespace: "$app:preorder-extension",
        key: "preorder_end_date",
        type: "date_time",
        value: new Date(
          formData.get("campaignEndDate") as string,
        ).toISOString(),
      },
      {
        ownerId: product.variantId,
        namespace: "$app:preorder-extension",
        key: "deposit_percent",
        type: "number_integer",
        value: String(formData.get("depositPercent") || "0"),
      },
      {
        ownerId: product.variantId,
        namespace: "$app:preorder-extension",
        key: "balance_due_date",
        type: "date",
        value: new Date(formData.get("balanceDueDate") as string).toISOString(),
      },
      {
        ownerId: product.variantId,
        namespace: "$app:preorder-extension",
        key: "preorder_max_units",
        type: "number_integer",
        value:
          campaignType == "IN_STOCK"
            ? String(product.variantInventory)
            : String(product?.maxUnit || "0"),
      },
      {
        ownerId: product.variantId,
        namespace: "$app:preorder-extension",
        key: "preorder_units_sold",
        type: "number_integer",
        value: String(product?.unitsSold || "0"),
      },
    ]);
    const productMetafields = products.flatMap((product: any) => [
      {
        ownerId: product.productId,
        namespace: "$app:preorder-extension",
        key: "campaign_id",
        type: "single_line_text_field",
        value: String(id),
      },
      {
        ownerId: product.productId,
        namespace: "$app:preorder-extension",
        key: "preorder",
        type: "boolean",
        value: "true",
      },
      {
        ownerId: product.productId,
        namespace: "$app:preorder-extension",
        key: "preorder_end_date",
        type: "date_time",
        value: new Date(
          formData.get("campaignEndDate") as string,
        ).toISOString(),
      },
      {
        ownerId: product.productId,
        namespace: "$app:preorder-extension",
        key: "deposit_percent",
        type: "number_integer",
        value: String(formData.get("depositPercent") || "0"),
      },
      {
        ownerId: product.productId,
        namespace: "$app:preorder-extension",
        key: "balance_due_date",
        type: "date",
        value: new Date(formData.get("balanceDueDate") as string).toISOString(),
      },
      {
        ownerId: product.productId,
        namespace: "$app:preorder-extension",
        key: "preorder_max_units",
        type: "number_integer",
        value:
          campaignType == "IN_STOCK"
            ? String(product.variantInventory)
            : String(product?.maxUnit || "0"),
      },
      {
        ownerId: product.productId,
        namespace: "$app:preorder-extension",
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
      console.error("❌ GraphQL mutation failed:", err);
      throw err;
    }

    // const discountType = formData.get("discountType") as DiscountType;
    // const variantIds = products.map((p: any) => p.variantId);
    // await applyDiscountToVariants(
    //   admin,
    //   variantIds,
    //   discountType,
    //   Number(formData.get("discountValue") || 0),
    // );

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
      formData.get("campaignType") == "ALWAYS"
    ) {
      allowOutOfStockForVariants(admin, products);
    }

    await updateCampaignStatus(params.id!, "PUBLISHED", shopId);
    // return redirect(`/app/`);
    return Response.json({ success: true, error: null, message: "Campaign Published Successfully" }, { status: 200 });
  }

  if (intent === "unpublish-campaign") {
    const id = formData.get("id");
    try {
      await admin.graphql(unpublishMutation, {
        variables: {
          handle: { type: "$app:preorder-extension", handle: id },
          status: "DRAFT",
        },
      });

      const products = JSON.parse((formData.get("products") as string) || "[]");
      if (products.length !== 0) {
        let metafields;

        if (secondaryIntent === "delete-campaign") {
          metafields = products.flatMap((product: any) => [
            {
              ownerId: product.variantId,
              namespace: "$app:preorder-extension",
              key: "campaign_id",
              type: "single_line_text_field",
              value: "null",
            },
            {
              ownerId: product.variantId,
              namespace: "$app:preorder-extension",
              key: "preorder",
              type: "boolean",
              value: "false",
            },
            {
              ownerId: product.productId,
              namespace: "$app:preorder-extension",
              key: "campaign_id",
              type: "single_line_text_field",
              value: "null",
            },
            {
              ownerId: product.productId,
              namespace: "$app:preorder-extension",
              key: "preorder",
              type: "boolean",
              value: "false",
            },
          ]);
        } else {
          metafields = products.flatMap((product: any) => [
            {
              ownerId: product.variantId,
              namespace: "$app:preorder-extension",
              key: "preorder",
              type: "boolean",
              value: "false",
            },
            {
              ownerId: product.productId,
              namespace: "$app:preorder-extension",
              key: "preorder",
              type: "boolean",
              value: "false",
            },
          ]);
        }

        try {
          const graphqlResponse = await admin.graphql(SET_PREORDER_METAFIELDS, {
            variables: { metafields },
          });

          const response = await graphqlResponse.json();

          if (response.data?.metafieldsSet?.userErrors?.length) {
            console.error(response.data.metafieldsSet.userErrors);
          }
        } catch (err) {
          console.error("❌ GraphQL mutation failed:", err);
          throw err;
        }

        const productResp = await admin.graphql(
          GET_PRODUCT_SELLING_PLAN_GROUPS,
          {
            variables: { id: products[0].productId },
          },
        );
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

        await updateCampaignStatus(params.id!, "UNPUBLISH", shopId);
      }

      if (secondaryIntent === "delete-campaign") {
        await deleteCampaign(params.id!, shopId);
        return Response.json(
          {
            success: true,
            error: null,
            message: "Campaign Deleted ",
          },
          { status: 200 },
        );
      }

      return Response.json({ success: true, error: null  , message: "Campaign Unpublished"}, { status: 200 });
    } catch (error) {
      console.log(error);
    }
  }

  return null;
};

export default function CampaignDetail() {
  const {
    campaign,
    products,
    parsedDesignSettingsResponse,
    parsedCampaignSettingsResponse,
    shopifyPaymentsEnabled,
    getDueByValt,
  } = useLoaderData<typeof loader>() as {
    campaign: any;
    products: any[];
    parsedDesignSettingsResponse: any;
    parsedCampaignSettingsResponse: any;
    shopifyPaymentsEnabled: boolean;
    getDueByValt: boolean;
  };
  const { productsWithPreorder } = useActionData<typeof action>() ?? {
    productsWithPreorder: [],
  };
  const actionData = useActionData<typeof action>();

  const [buttonLoading, setButtonLoading] = useState({
    publish: false,
    delete: false,
    save: false,
    saveAsDraft: false,
    addAll: false,
  });

  // const navigation = useNavigation();
  const campaignSettingsMap = parsedCampaignSettingsResponse;
  const parsedCampaignData = campaignSettingsMap;
  const designFieldsMap = parsedDesignSettingsResponse;
  const parsedDesignFields = designFieldsMap;
  const submit = useSubmit();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [productTagInput, setProductTagInput] = useState("");
  const [customerTagInput, setCustomerTagInput] = useState("");

  const [{ month, year }, setMonthYear] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const discarding = useRef(false);

  const MetaObjectDuePaymentData = parsedCampaignData.payment_schedule;
  const MetaObjectFullfillmentSchedule = parsedCampaignData.fulfillment;
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(),
    end: new Date(),
    duePaymentDate:
      MetaObjectDuePaymentData.type === "DAYS_AFTER"
        ? new Date()
        : new Date(MetaObjectDuePaymentData.value),
    campaignEndDate: new Date(parsedCampaignData.campaign_end_date),
    fullfillmentSchedule:
      MetaObjectFullfillmentSchedule.schedule.type === "DAYS_AFTER"
        ? new Date()
        : MetaObjectFullfillmentSchedule.schedule.value,
  });
  const initialDates = useRef(selectedDates);

  const [productRadio, setproductRadio] = useState("option1");
  const [selectedProducts, setSelectedProducts] = useState(products || []);
  const initialProducts = useRef(products);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignEndPicker, setCampaignEndPicker] = useState({
    month: selectedDates.campaignEndDate?.getMonth(),
    year: selectedDates.campaignEndDate?.getFullYear(),
    selected: {
      start: selectedDates.campaignEndDate,
      end: selectedDates.campaignEndDate,
    },
    popoverActive: false,
    inputValue: selectedDates.campaignEndDate?.toLocaleDateString(),
  });
  const [criticalChange, setCriticalChange] = useState(false);
  const [removedVarients, setRemovedVarients] = useState<string[]>([]);
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
  const [campaignData, setCampaignData] = useState<CampaignFields>({
    campaignName: campaign?.name,
    campaignType: parsedCampaignData?.campaigntype,
    productTags: parsedCampaignData?.campaigntags
      ? parsedCampaignData?.campaigntags.split(",")
      : [],
    customerTags: parsedCampaignData?.customerTags
      ? parsedCampaignData?.customerTags.split(",")
      : [],
    preOrderNoteKey: "Note",
    preOrderNoteValue: "Preorder",
    buttonText: parsedCampaignData?.button_text,
    shippingMessage: parsedCampaignData?.shipping_message,
    partialPaymentPercentage: campaign?.depositPercent,
    paymentMode:
      parsedCampaignData?.payment_type === "full" ? "full" : "partial",
    partialPaymentType: "percent",
    duePaymentType:
      parsedCampaignData?.payment_schedule.type === "DAYS_AFTER" ? 1 : 2,
    campaignEndTime: "00:00",
    fulfilmentMode: parsedCampaignData?.fulfillment.type,
    scheduledFullfillmentType:
      parsedCampaignData?.fulfillment.type === "SCHEDULED"
        ? parsedCampaignData?.fulfillment.schedule.type === "EXACT_DATE"
          ? 2
          : 1
        : 1,
    scheduledDays:
      parsedCampaignData?.fulfillment.schedule.type === "EXACT_DATE"
        ? 0
        : parsedCampaignData?.fulfillment.schedule.value,
    paymentAfterDays:
      parsedCampaignData?.payment_schedule?.type === "DAYS_AFTER"
        ? parsedCampaignData?.payment_schedule.value
        : 0,
    fullPaymentText: "Full Payment",
    partialPaymentText: "Partial Payment",
    partialPaymentInfoText:
      "Pay {payment} now and {remaining} will be charged on {date}",
    discountType: parsedCampaignData?.discount_type,
    discountValue: parsedCampaignData?.discountValue,
    getPaymentsViaValtedPayments: getDueByValt,
  });
  const initialCampaignRef = useRef(campaignData);
  const initialDesignRef = useRef(designFields);
  const [warningPopoverActive, setWarningPopoverActive] = useState(false);
  const [noProductWarning, setNoProductWarning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigation = useNavigation();
  const [formHasChanges, setFormHasChanges] = useState(false);

  const handleCampaignDataChange = <K extends keyof CampaignFields>(
    field: K,
    value: CampaignFields[K],
  ) => {
    setCampaignData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };
  const [saveBarActive, setSaveBarActive] = useState(false);

  const [activeButtonIndex, setActiveButtonIndex] = useState(-1);
  useEffect(() => {
    if (campaignData.discountType === "PERCENTAGE") {
      setActiveButtonIndex(0);
    } else if (campaignData.discountType === "FIXED") {
      setActiveButtonIndex(1);
    }
  }, [campaignData.discountType]);

  const handleCampaignEndMonthChange = useCallback(
    (newMonth: any, newYear: any) => {
      setCampaignEndPicker((prev) => ({
        ...prev,
        month: newMonth,
        year: newYear,
      }));
    },
    [],
  );

  // async function fetchProductsInCollection(id: string) {
  //   submit(
  //     { intent: "fetchProductsInCollection", collectionId: id },
  //     { method: "get" },
  //   );

  //   // if (prod) {
  //   //   setSelectedProducts(prod);
  //   // }
  // }

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

        // for (const collection of payload.selection) {
        //   const productsInCollection = await fetchProductsInCollection(
        //     collection.id,
        //   );
        //   allProducts = [...allProducts, ...productsInCollection];
        // }

        // remove duplicates by product id
        const uniqueProducts = Array.from(
          new Map(allProducts.map((p) => [p.id, p])).values(),
        );

        setSelectedProducts(uniqueProducts);
      }
    });

    picker.dispatch(ResourcePicker.Action.OPEN);
  };

  const handleMonthChange = useCallback((newMonth: any, newYear: any) => {
    setMonthYear({ month: newMonth, year: newYear });
  }, []);

  const handleDateChange = (field: string, range: any) => {
    const localDate = new Date(
      range.start.getFullYear(),
      range.start.getMonth(),
      range.start.getDate(),
    );

    setSelectedDates((prev) => ({ ...prev, [field]: localDate }));
    setPopoverActive((prev) => ({ ...prev, [field]: false }));
  };

  const [popoverActive, setPopoverActive] = useState({
    duePaymentDate: false,
    fullfillmentSchedule: false,
    campaignEndDate: false,
  });
  const togglePopover = useCallback((field: string) => {
    setPopoverActive((prev: any) => ({
      ...prev,
      [field]: !prev[field],
    }));
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

  const filteredProducts = selectedProducts?.filter((product: any) =>
    product.variantTitle?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleRemoveProduct(id: string) {
    // if (selectedProducts.length === 0) return; // do nothing if empty
    setSelectedProducts((prev: any) =>
      prev.filter((product: any) => product.variantId !== id),
    );
    setRemovedVarients((prev) => [...prev, id]);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && productTagInput.trim() !== "") {
      // setProductTags((prev) => [...prev, productTagInput.trim()]);
      const newTags = [...campaignData.productTags, productTagInput.trim()];
      handleCampaignDataChange("productTags", newTags);
      setProductTagInput("");
      event.preventDefault();
    }
  };

  const handleMaxUnitChange = (id: string, value: number) => {
    if (isNaN(value)) return;
    setSelectedProducts((prev: any) =>
      prev.map((product: any) =>
        product.variantId === id ? { ...product, maxUnit: String(value) } : product,
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

  async function handleUnpublish(id: string): Promise<void> {
    const valid = await validateForm();
    if (!valid) {
      return;
    }

    if (selectedProducts.length === 0) {
      setNoProductWarning(true);
      return;
    }

    setButtonLoading((prev) => ({ ...prev, publish: true }));
    const formData = new FormData();
    formData.append("intent", "unpublish-campaign");
    formData.append("secondaryIntent", "NONE");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("id", id);

    submit(formData, { method: "post" });
  }

  function handleSubmit(id: string): void {
    const formData = new FormData();
    formData.append("intent", "update-campaign");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("removedVarients", JSON.stringify(removedVarients));
    formData.append("id", id);
    formData.append("name", String(campaignData.campaignName));
    formData.append(
      "depositPercent",
      String(campaignData.partialPaymentPercentage),
    );
    // formData.append("balanceDueDate", DueDateinputValue);
    formData.append("refundDeadlineDays", "0");
    formData.append(
      "campaignEndDate",
      selectedDates.campaignEndDate.toISOString(),
    );
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("campaignType", String(campaignData.campaignType));
    formData.append("buttonText", String(campaignData.buttonText));
    formData.append("shippingMessage", String(campaignData.shippingMessage));
    formData.append("paymentMode", String(campaignData.paymentMode));
    formData.append("designFields", JSON.stringify(designFields));
    formData.append("discountType", campaignData.discountType);
    formData.append("discountValue", String(campaignData.discountValue));
    formData.append("orderTags", JSON.stringify(campaignData.productTags));
    formData.append("customerTags", JSON.stringify(campaignData.customerTags));
    formData.append(
      "getDueByValt",
      String(campaignData.getPaymentsViaValtedPayments),
    );
    formData.append("fulfilmentmode", String(campaignData.fulfilmentMode));
    formData.append(
      "collectionMode",
      campaignData.duePaymentType === 1 ? "DAYS_AFTER" : "EXACT_DATE",
    );
    formData.append("paymentAfterDays", String(campaignData.paymentAfterDays));
    formData.append("balanceDueDate", String(selectedDates.duePaymentDate));
    formData.append(
      "scheduledFulfilmentType",
      campaignData.scheduledFullfillmentType === 1
        ? "DAYS_AFTER"
        : "EXACT_DATE",
    );
    formData.append("fulfilmentDaysAfter", String(campaignData.scheduledDays));
    formData.append("fulfilmentDate", selectedDates.fullfillmentSchedule);
    formData.append("preOrderNoteKey", campaignData.preOrderNoteKey);
    formData.append("preOrderNoteValue", campaignData.preOrderNoteValue);
    formData.append("fullPaymentText", campaignData.fullPaymentText);
    formData.append("partialPaymentText", campaignData.partialPaymentText);
    formData.append(
      "partialPaymentInfoText",
      campaignData.partialPaymentInfoText,
    );

    submit(formData, { method: "post" });
  }

  const handleSave = async () => {
    const valid = await validateForm();

    if (valid === false) {
      return;
    }

    if (selectedProducts.length === 0) {
      setNoProductWarning(true);
      return;
    }

    setButtonLoading((prev) => ({ ...prev, save: true }));
    try {
       handleSubmit(String(campaign?.id));
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDiscard = () => {
    discarding.current = true;
    shopify.saveBar.hide("my-save-bar");
    setSaveBarActive(false);
    setCampaignData({ ...initialCampaignRef.current });
    setDesignFields({ ...initialDesignRef.current });
    setSelectedProducts([...initialProducts.current]);
    setSelectedDates({ ...initialDates.current });
    setRemovedVarients([]);
    shopify.saveBar.hide("my-save-bar");
    setSaveBarActive(false);
  };

  async function handlePublish(id: string): Promise<void> {
    const valid = await validateForm();

    if (valid === false) {
      return;
    }

    if (selectedProducts.length === 0) {
      setNoProductWarning(true);
      return;
    }

    setButtonLoading((prev) => ({ ...prev, publish: true }));
    const formData = new FormData();
    formData.append("intent", "publish-campaign");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("paymentMode", String(campaignData.paymentMode));
    formData.append(
      "depositPercent",
      String(campaignData.partialPaymentPercentage),
    );
    formData.append("balanceDueDate", String(selectedDates.duePaymentDate));
    formData.append(
      "campaignEndDate",
      selectedDates.campaignEndDate.toISOString(),
    );
    formData.append("discountType", campaignData.discountType);
    formData.append("discountValue", String(campaignData.discountValue));
    formData.append("orderTags", JSON.stringify(campaignData.productTags));
    formData.append("customerTags", JSON.stringify(campaignData.customerTags));
    formData.append("id", id);
    formData.append("fulfilmentmode", String(campaignData.fulfilmentMode));
    formData.append(
      "collectionMode",
      campaignData.duePaymentType === 1 ? "DAYS_AFTER" : "EXACT_DATE",
    );
    formData.append("paymentAfterDays", String(campaignData.paymentAfterDays));
    formData.append("balanceDueDate", String(selectedDates.duePaymentDate));
    formData.append(
      "scheduledFulfilmentType",
      campaignData.scheduledFullfillmentType === 1
        ? "DAYS_AFTER"
        : "EXACT_DATE",
    );
    formData.append("fulfilmentDaysAfter", String(campaignData.scheduledDays));
    formData.append("fulfilmentDate", selectedDates.fullfillmentSchedule);

    submit(formData, { method: "post" });
  }

  useEffect(() => {
    if (navigation.state === "idle" && actionData?.success) {
      shopify.saveBar.hide("my-save-bar");
      setSaveBarActive(false);
      shopify.toast.show(actionData.message);

      setButtonLoading((prev): any =>
        Object.fromEntries(Object.keys(prev).map((key) => [key, false])),
      );

      // also reset your initial refs so future changes track correctly
      initialDesignRef.current = designFields;
      initialCampaignRef.current = campaignData;
      initialProducts.current = selectedProducts;
      initialDates.current = selectedDates;

      navigate("/app");
    }
  }, [navigation.state, actionData]);

  useEffect(() => {
    const noChanges =
      JSON.stringify(designFields) ===
        JSON.stringify(initialDesignRef.current) &&
      JSON.stringify(campaignData) ===
        JSON.stringify(initialCampaignRef.current) &&
      JSON.stringify(selectedProducts) ===
        JSON.stringify(initialProducts.current) &&
      removedVarients.length === 0 &&
      JSON.stringify(selectedDates) === JSON.stringify(initialDates.current);

    setFormHasChanges(!noChanges);
  }, [
    designFields,
    selectedProducts,
    campaignData,
    removedVarients,
    selectedDates,
    saveBarActive,
  ]);

  useEffect(() => {
    if (discarding.current) {
      discarding.current = false;
      return;
    }

    const noChanges =
      JSON.stringify(designFields) ===
        JSON.stringify(initialDesignRef.current) &&
      JSON.stringify(campaignData) ===
        JSON.stringify(initialCampaignRef.current) &&
      JSON.stringify(selectedProducts) ===
        JSON.stringify(initialProducts.current) &&
      removedVarients.length === 0 &&
      JSON.stringify(selectedDates) === JSON.stringify(initialDates.current);

    if (noChanges) {
      shopify.saveBar.hide("my-save-bar");
      setSaveBarActive(false);
    } else if (removedVarients.length > 0 && actionData?.success) {
      shopify.saveBar.hide("my-save-bar");
      setSaveBarActive(false);
    } else {
      shopify.saveBar.show("my-save-bar");
      setSaveBarActive(true);
    }
  }, [
    designFields,
    selectedProducts,
    campaignData,
    removedVarients,
    selectedDates,
    saveBarActive,
    actionData,
  ]);

  const handleButtonClick = useCallback(
    (index: number) => {
      if (activeButtonIndex === index) return;
      setActiveButtonIndex(index);
      handleCampaignDataChange(
        "discountType",
        index === 0 ? "PERCENTAGE" : "FIXED",
      );
    },
    [activeButtonIndex],
  );

  const handleKeyDownCustomerTag = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && customerTagInput.trim() !== "") {
      const newTags = [...campaignData.customerTags, customerTagInput.trim()];
      setCustomerTagInput("");
      handleCampaignDataChange("customerTags", newTags);

      event.preventDefault();
    }
  };

  function handleRemoveTag(index: number): void {
    const updatedTags = [...campaignData.productTags];
    updatedTags.splice(index, 1);
    handleCampaignDataChange("productTags", updatedTags);
  }

  function handleRemoveCustomerTag(index: number) {
    const updatedTags = [...campaignData.customerTags];
    updatedTags.splice(index, 1);
    handleCampaignDataChange("customerTags", updatedTags);
  }

  useEffect(() => {
    if (criticalChange === false) {
      setCriticalChange(true);
    }
  }, [selectedProducts, campaignData, criticalChange]);


  const selectAllProducts = async () => {
    setButtonLoading(() => ({ ...buttonLoading, addAll: true }));
    const res = await fetch("/api/products");
    const allVariants = await res.json();
    setSelectedProducts(allVariants);
    setButtonLoading(() => ({ ...buttonLoading, addAll: false }));
  };

  useEffect(() => {
    // if (productFetched === true) {
    const formData = new FormData();
    formData.append("intent", "productsWithPreorder");
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("campaignId", campaign.id);

    submit(formData, { method: "post" });
    // }
  }, [selectedProducts, campaign.id]);

  useEffect(() => {
    let flag = false;
    if (!productsWithPreorder) return;
    for (let i = 0; i < productsWithPreorder.length; i++) {
      if (productsWithPreorder[i]?.associatedWithOtherCampaign == true) {
        flag = true;
        break;
      }
    }

    if (flag) {
      setWarningPopoverActive(true);
    } else {
      setWarningPopoverActive(false);
    }
  }, [selectedProducts, productsWithPreorder]);

  const handleDuplication = (id: any) => {
    const prod = productsWithPreorder?.find(
      (product: any) => product.id === id,
    );
    if (prod && prod.associatedWithOtherCampaign == true) {
      return true;
    }
  };

  const validateForm = async () => {
    const campaignResult: any = CampaignSchema.safeParse(campaignData);
    const designResult: any = DesignSchema.safeParse(designFields);

    const collectErrors = (obj: any) => {
      let messages: string[] = [];
      for (const key in obj) {
        if (Array.isArray(obj[key]?._errors)) {
          messages.push(...obj[key]._errors);
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
          messages.push(...collectErrors(obj[key]));
        }
      }
      return messages;
    };

    let errorMessages: string[] = [];

    if (!campaignResult.success) {
      const formatted = campaignResult.error.format();
      errorMessages = [...errorMessages, ...collectErrors(formatted)];
    }

    if (!designResult.success) {
      const formattedDesign = designResult.error.format();
      errorMessages = [...errorMessages, ...collectErrors(formattedDesign)];
    }

    if (errorMessages.length > 0) {
      setErrors(errorMessages);
      return false;
    }

    setErrors([]);
    return true;
  };

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title={`Update Campaign`}
        titleMetadata={
          campaign?.status === "PUBLISHED" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Badge tone="success">Published</Badge>
              {/* {navigation.state !== "idle" && <Spinner size="small" />} */}
            </div>
          ) : campaign?.status === "DRAFT" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Badge tone="info">Draft</Badge>
              {/* {navigation.state !== "idle" && <Spinner size="small" />} */}
            </div>
          ) : (
            <div>
              <Badge tone="info">Not published</Badge>
              {/* {navigation.state !== "idle" && <Spinner size="small" />} */}
            </div>
          )
        }
        backAction={{
          content: "Back",
          onAction: () => {
            if (saveBarActive) {
              shopify.saveBar.leaveConfirmation();
            } else {
              navigate("/app");
            }
          },
        }}
        primaryAction={{
          content: campaign?.status === "PUBLISHED" ? "Unpublish" : "Publish",
          loading: buttonLoading.publish || buttonLoading.save,
          disabled:
            buttonLoading.publish || buttonLoading.delete || buttonLoading.save,
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
            disabled:
              buttonLoading.publish ||
              buttonLoading.delete ||
              buttonLoading.save,
          },
        ]}
      >
        <SaveBar id="my-save-bar">
          <button
            variant="primary"
            onClick={handleSave}
            loading={
              (buttonLoading.publish ||
                buttonLoading.save ||
                buttonLoading.delete) === true
                ? ""
                : false
            }
            disabled={buttonLoading.publish || buttonLoading.save}
          ></button>
          <button
            onClick={handleDiscard}
            disabled={
              buttonLoading.publish ||
              buttonLoading.save ||
              buttonLoading.delete
            }
          ></button>
        </SaveBar>

        {errors.length > 0 && (
          <div style={{ padding: 10 }}>
            <Banner title="Please fix the following errors" tone="critical">
              <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </Banner>
          </div>
        )}
        {noProductWarning && errors.length === 0 && (
          <div style={{ padding: 10 }}>
            <Banner
              title="Cannot save campaign"
              tone="warning"
              onDismiss={() => setNoProductWarning(false)}
            >
              You must select at least one product before saving your campaign.
            </Banner>
          </div>
        )}
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
            <button
              onClick={() => {
                shopify.modal.hide("delete-modal");
              }}
            >
              Cancel
            </button>
          </TitleBar>
        </Modal>
        <Tabs tabs={tabs} selected={selected} onSelect={setSelected} />

        <form method="post" onSubmit={() => handleSubmit(String(campaign?.id))}>
          <div
            // style={{
            //   display: "flex",
            //   position: "relative",
            //   paddingBottom: 20,
            //   paddingTop: 20,
            // }}
            className="form-parent"
          >
            {/* left */}
            {selected === 0 && (
              <CampaignForm
                campaignData={campaignData}
                handleCampaignDataChange={handleCampaignDataChange}
                handleRemoveTag={handleRemoveTag}
                handleRemoveCustomerTag={handleRemoveCustomerTag}
                selectedDates={selectedDates}
                handleDateChange={handleDateChange}
                togglePopover={togglePopover}
                popoverActive={popoverActive}
                handleMonthChange={handleMonthChange}
                handleCampaignEndMonthChange={handleCampaignEndMonthChange}
                campaignEndPicker={campaignEndPicker}
                month={month}
                year={year}
                plusStore={true}
                setSelected={setSelected}
                setProductTagInput={setProductTagInput}
                setCustomerTagInput={setCustomerTagInput}
                handleKeyDown={handleKeyDown}
                handleKeyDownCustomerTag={handleKeyDownCustomerTag}
                productTagInput={productTagInput}
                customerTagInput={customerTagInput}
                formatDate={formatDate}
                activeButtonIndex={activeButtonIndex}
                handleButtonClick={handleButtonClick}
                shopifyPaymentsEnabled={shopifyPaymentsEnabled}
              />
            )}
            {selected === 1 && (
              <div style={{ flex: 1.5 }}>
                <PreviewDesign
                  designFields={designFields}
                  setDesignFields={setDesignFields}
                  setTabSelected={setSelected}
                />
              </div>
            )}

            {/* right */}
            {(selected === 0 || selected === 1) && (
              <div
                style={{ flex: 1, marginLeft: 20 }}
                className="preview-component"
              >
                {/* preview */}
                <PreviewComponent
                  campaignData={campaignData}
                  designFields={designFields}
                  formatDate={formatDate}
                  selectedDates={selectedDates}
                />
              </div>
            )}
          </div>
          <div className="mobile-navigation-actions">
            {selected === 1 && (
              <div className="mobile-navigation-actions__back">
                <Button
                  onClick={() => setSelected(selected - 1)}
                  variant="secondary"
                >
                  Back
                </Button>
              </div>
            )}

            {(selected === 0 || selected === 1) && (
              <div className="mobile-navigation-actions__next">
                <Button
                  onClick={() => {
                    setSelected(selected + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  variant="primary"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </form>

        {selected === 2 && (
          <div>
            {selectedProducts.length === 0 && (
              <div>
                <Card padding={"1000"}>
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
                        Add Products to Preorder
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
                          loading={buttonLoading.addAll}
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
              <div>
                {warningPopoverActive && (
                  <div style={{ padding: "8px" }}>
                    <Banner
                      title="Some of the products are assigned to multiple campaigns"
                      tone="warning"
                    >
                      <p>
                        Highlighted products are assigned to multiple Preorder
                        campaigns. When publishing this campaign products will
                        be removed from other campaigns.
                      </p>
                    </Banner>
                  </div>
                )}
                <Card>
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
                        label="Search products"
                        labelHidden
                        value={searchTerm}
                        onChange={setSearchTerm}
                        autoComplete="off"
                        placeholder="Search by product name"
                      />
                    </div>
                    <div style={{ marginLeft: "10px" }}>
                      <ButtonGroup noWrap>
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
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
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
                          {campaignData.campaignType !== "IN_STOCK" && (
                            <th
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              Inventory limit
                            </th>
                          )}
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
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 && (
                          <tr>
                            <td
                              colSpan={campaignData.campaignType !== "IN_STOCK" ? 6 : 5}
                              style={{
                                padding: 20,
                                textAlign: "center",
                                color: "#666",
                                fontSize: 14,
                              }}
                            >
                              No products found
                            </td>
                          </tr>
                        )}
                        {filteredProducts.map((product) => (
                          <tr
                            key={product.varientId}
                            style={{
                              backgroundColor: handleDuplication(
                                product.variantId,
                              )
                                ? "#ea9898ff"
                                : "",
                            }}
                          >
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
                                : (product.inventory ?? "0")}
                            </td>
                            {campaignData.campaignType !== "IN_STOCK" && (
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
                                  label="Inventory limit"
                                  labelHidden
                                  autoComplete="off"
                                  value={
                                    campaignData.campaignType ===
                                    ("IN_STOCK" as CampaignType)
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
                            )}
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              {formatCurrency(product.variantPrice, "USD")}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                cursor: "pointer",
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
              </div>
            )}
            <div style={{ margin: 10 }}>
              <InlineStack align="end" gap={"100"}>
                <ButtonGroup>
                  <Button
                    onClick={handleSave}
                    loading={buttonLoading.save}
                    disabled={
                      buttonLoading.save ||
                      buttonLoading.publish ||
                      formHasChanges === false ||
                      buttonLoading.delete
                    }
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      if (campaign?.status === "PUBLISHED") {
                        handleUnpublish(String(campaign?.id));
                      } else {
                        handlePublish(String(campaign?.id));
                      }
                    }}
                    loading={buttonLoading.publish}
                    disabled={
                      buttonLoading.publish ||
                      buttonLoading.save ||
                      buttonLoading.delete
                    }
                    variant="primary"
                  >
                    {campaign?.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </Button>
                </ButtonGroup>
              </InlineStack>
            </div>
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
                    label="Specific Product"
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
