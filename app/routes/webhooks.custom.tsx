import { createDuePayment, createOrder } from "app/models/campaign.server";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import { v4 as uuidv4 } from "uuid";
import { generateEmailTemplate } from "app/utils/generateEmailTemplate";
import nodemailer from "nodemailer";
import { incrementUnitsSold } from "app/models/preorder.server";
import {
  // GetCampaignIdsQuery,
  GetVariantCampaignIdsQuery,
} from "app/graphql/queries/campaign";
import {
  AddTagsToOrderMutation,
  draftOrderCreate,
  getOrderVaultedMethods,
} from "app/graphql/queries/orders";
import { GET_SHOP_WITH_PLAN } from "app/graphql/queries/shop";
import { draftOrderInvoiceSendMutation } from "app/graphql/mutation/orders";

export const action = async ({ request }: { request: Request }) => {
  const { topic, shop, payload, admin } = await authenticate.webhook(request);
  const orderPaid = async (payload: any) => {
    if (topic === "ORDERS_CREATE") {
      try {
        const products = payload.line_items || [];
        const line_items = payload.line_items || [];
        const variantIds = line_items.map((item: any) => item.variant_id);


        const formattedVariantIds = variantIds.map((id: number) => {
          return `gid://shopify/ProductVariant/${id}`;
        });

        const GetCampaignIdsQueryResponse = await admin?.graphql(
          GetVariantCampaignIdsQuery,
          {
            variables: { ids: formattedVariantIds },
          },
        );

        const GetCampaignIdsQueryResponseBody =
          await GetCampaignIdsQueryResponse?.json();

        let campaignIds: string[] = [];
        for (const node of GetCampaignIdsQueryResponseBody?.data.nodes) {
          if (node?.metafield?.value) {
            campaignIds.push(node.metafield.value);
          }
        }

        // find unique campaign ids
        campaignIds = [...new Set(campaignIds)];
        console.log("campaignIds", campaignIds);

        let orderContainsPreorderItem = campaignIds.length > 0;
        if (orderContainsPreorderItem === false) {
          return;
        }

        // //update preorder_units_sold
        for (const variantId of formattedVariantIds) {
          try {
            await incrementUnitsSold(shop, variantId);
          } catch (error) {
            console.log(error);
          }
        }
        //update no of orders for campaign
        for (const campaignId of campaignIds) {
          await prisma.preorderCampaign.update({
            where: { id: campaignId },
            data: {
              totalOrders: {
                increment: 1,
              },
            },
          });
        }

        // get Tags from campaign ids
        let orderTags: string[] = [];
        let customerTags: string[] = [];

        if (campaignIds.length > 0) {
          const campaigns = await prisma.preorderCampaign.findMany({
            where: {
              id: {
                in: campaignIds,
              },
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
          // add tags to order using mutation
          const uniqueTags = [...new Set(orderTags), ...new Set(customerTags)];

          const orderId = payload.admin_graphql_api_id;
          // const AddTagsToOrderMutationResponse =
          await admin?.graphql(AddTagsToOrderMutation, {
            variables: { id: orderId, tags: uniqueTags },
          });

          // const AddTagsToOrderMutationResponseBody =
          //   await AddTagsToOrderMutationResponse.json();
        }

        if (topic === "ORDERS_CREATE" && orderContainsPreorderItem) {
          const orderId = payload.admin_graphql_api_id;
          const formattedOrderId = orderId.split("/").pop();
          const customerId = payload.customer?.admin_graphql_api_id;
          const order_number = payload.order_number;
          const schedules = payload?.payment_terms?.payment_schedules || [];
          const secondSchedule = schedules[1];
          const customerEmail = payload.email || payload.customer?.email;
          const remaining = Number(secondSchedule?.amount);
          const uuid = uuidv4();
          const response = await admin?.graphql(GET_SHOP_WITH_PLAN);
          const data = await response?.json();
          const shop = data?.data.shop;
          const shopId = shop.id;
          const plusStore = shop.plan.shopifyPlus;
          const storeDomain = shop.primaryDomain?.host;

          // getDueByValt is true
          // this should be in whole store (Because if order contains one valulted payment order and draft payment order i can go wrong)
          let vaultPayment = false;
          if (plusStore) {
            const campaign = await prisma.preorderCampaign.findFirst({
              where: {
                id: campaignIds[0],
              },
            });

            if (campaign?.getDueByValt) {
              vaultPayment = true;
            }
          }

          //find email settings respective to shop

          // get email template
          const emailSettings = await prisma.store.findFirst({
            where: { shopId: shopId },
            select: {
              ConfrimOrderEmailSettings: true,
            },
          });

          const ParsedemailSettings = emailSettings?.ConfrimOrderEmailSettings;

          const emailConsent = await prisma.store.findFirst({
            where: { shopId: shopId },
            select: {
              sendCustomEmail: true,
            },
          });

         await createOrder({
            order_number,
            order_id: orderId,
             ...(secondSchedule?.due_at && { dueDate: secondSchedule.due_at }),
            balanceAmount: remaining?? 0,
            paymentStatus: remaining > 0 ? "PENDING" : "PAID",
            storeId: shopId,
            customerEmail: customerEmail,
          });

          //send update email
          try {
            if (emailConsent?.sendCustomEmail) {
              const emailTemplate = generateEmailTemplate(
                ParsedemailSettings,
                products,
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



          // // Draft order mutation
          // the only way to match og order with draft order is note key
          if (remaining > 0 && vaultPayment === false) {

            await prisma.campaignOrders.update({
              where: {
                order_id: orderId,
              }
              ,
              data: {
                draft_order_id: uuid,
              },
            })


            const variables = {
              input: {
                customerId,
                lineItems: [
                  {
                    title: "Remaining Balance Payment",
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

            if (data?.data.draftOrderCreate.userErrors.length) {
              console.error(
                "❌ Draft order errors:",
                data.data.draftOrderCreate.userErrors,
              );
            } else {
              console.log(
                "✅ Draft order created:",
                data?.data.draftOrderCreate.draftOrder,
              );
              console.log(
                "📧 Invoice URL:",
                data?.data.draftOrderCreate.draftOrder.invoiceUrl,
              );
            }

            const draftOrderId = data?.data.draftOrderCreate.draftOrder.id;

            // Call Shopify Admin API
            const emailResponse = await admin?.graphql(
              draftOrderInvoiceSendMutation,
              {
                variables: {
                  id: draftOrderId,
                  email: {
                    to: customerEmail,
                  },
                },
              },
            );

            const emailData = await emailResponse?.json();
            console.log(
              "📧 Invoice send response:",
              JSON.stringify(emailData, null, 2),
            );

            return new Response("OK", {
              status: 200,
            });
          }
          //if plus store and getDueByValt is true then create mandate
          else if (remaining > 0 && vaultPayment) {
            const response = await admin?.graphql(getOrderVaultedMethods, {
              variables: { id: orderId },
            });

            const { data } = await response?.json();
            const methods =
              data?.order?.paymentCollectionDetails?.vaultedPaymentMethods;
            const mandateId = methods?.[0]?.id;

            // const accessTokenRes = await prisma.session.findFirst({
            //   where: {
            //     shop: storeDomain,
            //   },
            //   select: {
            //     accessToken: true,
            //   },
            // });

            // const accessToken = accessTokenRes?.accessToken || "";

            const duePaymentCreation = await createDuePayment(
              orderId,
              crypto.randomUUID().replace(/-/g, "").slice(0, 32),
              remaining.toString(),
              secondSchedule.currency_code,
              mandateId,
              secondSchedule.due_at,
              "PENDING",
              storeDomain,
            );

            console.log("Due payment created:", duePaymentCreation);

            return new Response("OK", {
              status: 200,
            });
          }
          return new Response("OK", {
            status: 200,
          });
        }
      } catch (error) {
        console.error("❌ Webhook error:", error);
      }
    }
  };
  orderPaid(payload);

  return new Response("ok");
};
