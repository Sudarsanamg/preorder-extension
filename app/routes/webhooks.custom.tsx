import { createOrder } from "app/models/campaign.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: { request: Request }) => {
  console.log("Webhook hitted");
  try {
    const { topic, shop, payload, admin } = await authenticate.webhook(request);
    console.log("Webhook hitted");
    // console.log(payload);

    if (topic === "ORDERS_CREATE") {
      const orderId = payload.admin_graphql_api_id;
      const customerId = payload.customer?.admin_graphql_api_id;
      const order_number = payload.order_number;

      console.log("🛒 New order created:", orderId);
      const schedules = payload?.payment_terms?.payment_schedules || [];
      const secondSchedule = schedules[1];
      const customerEmail = payload.email || payload.customer?.email;
      console.log(secondSchedule);

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
          draft_order_id: draftOrderId,
          dueDate: new Date(),
          balanceAmount: remaining,
          paymentStatus: "pending",
        });

        console.log("✅ Order created:", newOrder);
      }
    }
  } catch (error) {
    console.error("❌ Webhook error:", error);
  }

  return new Response("ok");
};
