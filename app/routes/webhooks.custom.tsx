import {
  createOrder,
  findOrder,
  updateOrderPaymentStatus,
} from "app/models/campaign.server";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import { v4 as uuidv4 } from "uuid";
import { generateEmailTemplate } from "app/utils/generateEmailTemplate";
import nodemailer from "nodemailer";

export const action = async ({ request }: { request: Request }) => {
  console.log("Webhook hitted");
  try {
    const { topic, shop, payload, admin } = await authenticate.webhook(request);
    console.log("Webhook hitted");
    // console.log('Order Number',payload.order_number);
    // console.log(payload);
    console.log(`Received ${topic} webhook for ${shop}`);
    // console.log(payload);
    const line_items = payload.line_items || [];
    const productIds = line_items.map((item: any) => item.product_id);

    const formattedProductIds = productIds.map((id: number) => {
      return `gid://shopify/Product/${id}`;
    });

    const GetCampaignIdsQuery = `
  query GetCampaignIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        metafield(namespace: "custom", key: "campaign_id") {
          value
        }
      }
    }
  }
`;

const GetCampaignIdsQueryResponse = await admin.graphql(GetCampaignIdsQuery, {
  variables: { ids: formattedProductIds },
});

const GetCampaignIdsQueryResponseBody = await GetCampaignIdsQueryResponse.json();

let campaignIds: string[] = [];
for (const node of GetCampaignIdsQueryResponseBody.data.nodes) {
  if (node?.metafield?.value) {
    campaignIds.push(node.metafield.value);
  }
}

// find unique campaign ids
campaignIds = [...new Set(campaignIds)];

let orderContainsPreorderItem = false;
if(campaignIds.length > 0) {
  orderContainsPreorderItem = true;
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
if(orderTags.length > 0 && orderContainsPreorderItem){
  // add tags to order using mutation
  const AddTagsToOrderMutation = `
  mutation AddTagsToOrder($id: ID!, $tags: [String!]!) {
    orderUpdate(input: {id: $id, tags: $tags}) {
      order {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

  const orderId = payload.admin_graphql_api_id;
  const AddTagsToOrderMutationResponse = await admin.graphql(
    AddTagsToOrderMutation,
    {
      variables: { id: orderId, tags: [...orderTags,...customerTags] },
    },
  );

  const AddTagsToOrderMutationResponseBody =
    await AddTagsToOrderMutationResponse.json();  
  console.log(
    AddTagsToOrderMutationResponseBody,
    "AddTagsToOrderMutationResponseBody >>>>>>>>>>>>>>>>>>>>>>",
  );
}

    if (topic === "ORDERS_CREATE") {
      const orderId = payload.admin_graphql_api_id;
      const formattedOrderId = orderId.split("/").pop();
      const customerId = payload.customer?.admin_graphql_api_id;
      const order_number = payload.order_number;
      // console.log("🛒 New order created:", orderId);
      const schedules = payload?.payment_terms?.payment_schedules || [];
      const secondSchedule = schedules[1];
      const customerEmail = payload.email || payload.customer?.email;
      // console.log(secondSchedule);

      // // Calculate remaining amount from your pre-order logic
      const remaining = Number(secondSchedule?.amount);

      // console.log("💰 Remaining balance to invoice:", remaining);

      // // Draft order mutation
      if (remaining > 0) {
        const mutation = `
        mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
              invoiceUrl
              totalPriceSet {
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

        const uuid = uuidv4();

        const variables = {
          input: {
            customerId, // link draft order to same customer
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

        const response = await admin.graphql(mutation, { variables });
        const data = await response.json();

        console.log(data);

        if (data.data.draftOrderCreate.userErrors.length) {
          console.error(
            "❌ Draft order errors:",
            data.data.draftOrderCreate.userErrors,
          );
        } else {
          console.log(
            "✅ Draft order created:",
            data.data.draftOrderCreate.draftOrder,
          );
          console.log(
            "📧 Invoice URL:",
            data.data.draftOrderCreate.draftOrder.invoiceUrl,
          );
        }

        const draftOrderId = data.data.draftOrderCreate.draftOrder.id;

        const emailMutation = `
        mutation sendInvoice($id: ID!, $email: EmailInput!) {
          draftOrderInvoiceSend(id: $id, email: $email) {
            draftOrder {
              id
              invoiceUrl
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

        // Call Shopify Admin API
        const emailResponse = await admin.graphql(emailMutation, {
          variables: {
            id: draftOrderId,
            email: {
              to: customerEmail,
            },
          },
        });

        const emailData = await emailResponse.json();
        console.log(
          "📧 Invoice send response:",
          JSON.stringify(emailData, null, 2),
        );

        const newOrder = await createOrder({
          order_number,
          order_id: orderId,
          draft_order_id: uuid,
          dueDate: new Date(),
          balanceAmount: remaining,
          paymentStatus: "pending",
        });

        console.log("✅ Order created:", newOrder);

        const storeIdQuery = `{
    shop {
      id
      name
      myshopifyDomain
    }
  }`;

        const storeIdQueryResponse = await admin.graphql(storeIdQuery);
        const storeIdQueryResponseData = await storeIdQueryResponse.json();

        const shopId = storeIdQueryResponseData.data.shop.id;

        // get email template
        const emailSettings = await prisma.emailSettings.findFirst({
          where: { shopId },
        });

        const emailTemplate = generateEmailTemplate({...emailSettings, orderId: formattedOrderId});

        const transporter = nodemailer.createTransport({
          service: "Gmail", // or use SMTP/SendGrid/Postmark
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        try {
          await transporter.sendMail({
            from: '"Preorder Store" <no-reply@preorderstore.com>',
            to: customerEmail,
            subject: "Your Preorder is Confirmed!",
            html: emailTemplate,
          });
        } catch (error) {
          console.error("❌ Email send error:", error);
        }
      }
      // }
    }

    // if(topic === "ORDERS_UPDATE"){
    //   const orderId = payload.admin_graphql_api_id;
    //   console.log("🛒 Order updated:", orderId);
    // }

    if (topic === "DRAFT_ORDERS_UPDATE") {
      console.log("🛒 Draft payment update hitted");
      console.log(payload);
    }
  } catch (error) {
    console.error("❌ Webhook error:", error);
  }

  return new Response("ok");
};
