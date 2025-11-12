import { createDuePayment, createOrder } from "app/models/campaign.server";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import { v4 as uuidv4 } from "uuid";
import { generateEmailTemplate } from "app/utils/generateEmailTemplate";
import nodemailer from "nodemailer";
import { incrementUnitsSold } from "app/models/preorder.server";
import {
  AddTagsToOrderMutation,
  draftOrderCreate,
  getOrderVaultedMethods,
  getOrderWithProducts,
} from "app/graphql/queries/orders";
import { draftOrderInvoiceSendMutation } from "app/graphql/mutation/orders";
import { Decimal } from "@prisma/client/runtime/library";
import type { FulfillmentStatus } from "@prisma/client";

export const action = async ({ request }: { request: Request }) => {
  try {
    const { topic, shop, payload, admin } = await authenticate.webhook(request);

    if (topic !== "ORDERS_CREATE") {
      return Response.json({ error: "Invalid topic" }, { status: 200 });
    }

    const store = await prisma.store.findUnique({
      where: { shopifyDomain: shop },
      select: { id: true },
    });

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 200 });
    }
    const storeId = store.id;

    const orderCreate = async (payload: any) => {
      if (topic === "ORDERS_CREATE") {
        try {
          const line_items = payload.line_items || [];
          const variantData = line_items.map((item: any) => ({
            id: item.variant_id,
            quantity: item.quantity,
          }));

          let campaignIds = line_items
            .map((item: { properties: { name: string; value: string }[] }) => {
              const prop = item.properties?.find(
                (p) => p.name === "_campaignId",
              );
              return prop ? prop.value : null;
            })
            .filter(Boolean);

          campaignIds = [...new Set(campaignIds)];

          if(campaignIds.length === 0) {
            return Response.json({ error: "No campaign found" }, { status: 200 });
          }

          let orderContainsPreorderItem = campaignIds.length > 0;

          for (const data of variantData) {
            try {
              await incrementUnitsSold(shop, data);
            } catch (error) {
              console.log(error);
            }
          }

          for (const campaignId of campaignIds) {
            await prisma.preorderCampaign.update({
              where: {
                id: campaignId,
                storeId: storeId,
              },
              data: {
                totalOrders: {
                  increment: 1,
                },
              },
            });
          }

          let orderTags: string[] = [];
          let customerTags: string[] = [];

          if (campaignIds.length > 0) {
            const campaigns = await prisma.preorderCampaign.findMany({
              where: {
                id: {
                  in: campaignIds,
                },
                storeId: storeId,
              },
            });

            for (const campaign of campaigns) {
              if (campaign.orderTags) {
                orderTags.push(String(campaign.orderTags));
              }
              if (campaign.customerTags) {
                customerTags.push(String(campaign.customerTags));
              }
            }
          }
          if (orderTags.length > 0 && orderContainsPreorderItem) {
            const uniqueTags = [
              ...new Set(orderTags),
              ...new Set(customerTags),
            ];

            const orderId = payload.admin_graphql_api_id;
            await admin?.graphql(AddTagsToOrderMutation, {
              variables: { id: orderId, tags: uniqueTags },
            });
          }

          if (orderContainsPreorderItem) {
            const orderId = payload.admin_graphql_api_id;
            const formattedOrderId = orderId.split("/").pop();
            const customerId = payload.customer?.admin_graphql_api_id;
            const order_number = payload.order_number;
            const schedules = payload?.payment_terms?.payment_schedules || [];
            const secondSchedule = schedules[1];
            const customerEmail = payload.email || payload.customer?.email;
            const remaining = Number(secondSchedule?.amount);
            const uuid = uuidv4();
            let vaultPayment = false;

            const campaign = await prisma.preorderCampaign.findFirst({
              where: {
                id: campaignIds[0],
                storeId: storeId,
              },
            });

            if (campaign?.getDueByValt) {
              vaultPayment = true;
            }

            const emailSettings = await prisma.store.findFirst({
              where: { id: storeId },
              select: {
                ConfrimOrderEmailSettings: true,
              },
            });

            const ParsedemailSettings =
              emailSettings?.ConfrimOrderEmailSettings;

            const emailConsent = await prisma.store.findFirst({
              where: { id: storeId },
              select: {
                sendCustomEmail: true,
              },
            });

            const fulfillmentStatus =
              payload.fulfillment_status || "unfulfilled";
            const mapFulfillmentStatus = (
              status: string | null,
            ): FulfillmentStatus => {
              switch (status) {
                case "fulfilled":
                  return "FULFILLED";
                case "on_hold":
                  return "ON_HOLD";
                default:
                  return "UNFULFILLED";
              }
            };

            const campaignOrder = await createOrder({
              order_number,
              order_id: orderId,
              ...(secondSchedule?.due_at && { dueDate: secondSchedule.due_at }),
              balanceAmount: remaining ?? 0,
              paymentStatus: remaining > 0 ? "PENDING" : "PAID",
              storeId: storeId,
              customerEmail: customerEmail,
              totalAmount: new Decimal(payload.total_price),
              currency: payload.currency,
              fulfilmentStatus: mapFulfillmentStatus(fulfillmentStatus),
              campaignId: campaignIds[0],
            });

            const getOrderWithProductsResponse = await getOrderWithProducts(
              orderId,
              shop,
            );

            try {
              if (emailConsent?.sendCustomEmail) {
                const emailTemplate = generateEmailTemplate(
                  ParsedemailSettings,
                  getOrderWithProductsResponse,
                  formattedOrderId,
                );

                const transporter = nodemailer.createTransport({
                  service: "Gmail",
                  auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                  },
                });

                const emailConfig = {
                  fromName: "Preorder",
                  replyName: "Preorder@noreply.com",
                };

                try {
                  await transporter.sendMail({
                    from: `"${emailConfig?.fromName}" ${emailConfig?.replyName} <${emailConfig?.replyName}>`,
                    to: customerEmail,
                    subject: "Your Preorder is Confirmed!",
                    html: emailTemplate,
                  });
                } catch (error) {
                  console.error("❌ Email send error:", error);
                }
              }
            } catch (error) {
              console.error("❌ Email error:", error);
            }

            if (remaining > 0 && vaultPayment === false) {
              await prisma.campaignOrders.update({
                where: {
                  order_id: orderId,
                  storeId: storeId,
                },
                data: {
                  draft_order_id: uuid,
                },
              });

              const variables = {
                input: {
                  customerId,
                  lineItems: [
                    {
                      title: `Remaining Balance Payment for order #${order_number}`,
                      quantity: 1,
                      originalUnitPrice: remaining,
                    },
                  ],
                  note: uuid,
                  useCustomerDefaultAddress: true,
                },
              };

              const response = await admin?.graphql(draftOrderCreate, {
                variables,
              });
              const data = await response?.json();

              const draftOrderId = data?.data.draftOrderCreate.draftOrder.id;

              // Call Shopify Admin API
              await admin?.graphql(draftOrderInvoiceSendMutation, {
                variables: {
                  id: draftOrderId,
                  email: {
                    to: customerEmail,
                  },
                },
              });

              return new Response("OK", {
                status: 200,
              });
            }
            //if plus store and getDueByValt is true then create mandate
            else if (remaining > 0 && vaultPayment) {
              const response = await admin?.graphql(getOrderVaultedMethods, {
                variables: { id: orderId },
              });

              const { data }: any = await response?.json();
              const methods =
                data?.order?.paymentCollectionDetails?.vaultedPaymentMethods;
              const mandateId = methods?.[0]?.id;

             const dueOrder = await createDuePayment(
                orderId,
                remaining.toString(),
                secondSchedule.currency,
                mandateId,
                secondSchedule.due_at,
                "PENDING",
                campaignOrder.id,
                storeId,
              );

              console.log("dueOrder", dueOrder);

              return new Response("OK", {
                status: 200,
              });
            }
            return new Response("OK", {
              status: 200,
            });
          }
        } catch (error) {
          console.error(" Webhook error:", error);
        }
      }
    };
    orderCreate(payload);
  } catch (error) {
    console.error(" Webhook error:", error);
  }

  return new Response("ok");
};
