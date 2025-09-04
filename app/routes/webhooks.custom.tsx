import { authenticate } from "../shopify.server";

export const action = async ({ request }: { request: Request }) => {
    console.log('Webhook hitted');
  try {
    

  const { topic, shop, payload, admin } = await authenticate.webhook(request);
  console.log('Webhook hitted');

  if (topic === "ORDERS_CREATE") {
    const orderGid = payload.admin_graphql_api_id;
    console.log("🛒 New order created:", orderGid);

    const query = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          paymentTerms {
            paymentSchedules(first: 5) {
              edges {
                node {
                  id
                  dueAt
                  amount {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          paymentMandates(first: 1) {
            edges {
              node {
                id
                status
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query, { variables: { id: orderGid } });
    const data = await response.json();

    console.log("📦 Order full data:", JSON.stringify(data, null, 2));

    const order = data?.data?.order;

    // --- Extract mandateId ---
    const mandateId = order?.paymentMandates?.edges?.[0]?.node?.id || null;

    // --- Extract total price ---
    const total = parseFloat(order?.totalPriceSet?.shopMoney?.amount || "0");

    // --- Extract payment schedules ---
    const schedules = order?.paymentTerms?.paymentSchedules?.edges || [];

    // Deposit = first schedule, Remaining = later schedules
    const deposit = schedules[0]?.node?.amount?.amount
      ? parseFloat(schedules[0].node.amount.amount)
      : 0;

    // Find the next due schedule (if any)
    const remainingSchedule = schedules.find((s: any, i: number) => i > 0);

    const remainingAmount = remainingSchedule
      ? parseFloat(remainingSchedule.node.amount.amount)
      : total - deposit;

    const dueDate = remainingSchedule?.node?.dueAt || null;

    // --- Log them cleanly ---
    console.log("💳 Mandate ID:", mandateId);
    console.log("💰 Total:", total);
    console.log("💵 Deposit:", deposit);
    console.log("⏳ Remaining Amount:", remainingAmount);
    console.log("📅 Due Date:", dueDate);

    // 👉 Store these in your DB for cron job later
    // await prisma.preorder.create({
    //   data: { orderId: orderGid, mandateId, remainingAmount, dueDate, shop }
    // });
  }
    } catch (error) {
    console.log(error);
  }

  return new Response("ok");
};
