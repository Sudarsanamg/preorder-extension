import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  DataTable,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "app/shopify.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { getOrders } from "app/models/campaign.server";
import { useLoaderData ,  useNavigate} from "@remix-run/react";



export const loader = async ({ request }: LoaderFunctionArgs) => {
    const adminSession = await authenticate.admin(request);

    // console.log(adminSession.session.shop)

  const orders = await getOrders();

    const shopDomain = adminSession.session.shop;


  return { orders ,shopDomain };

  
};

export default function AdditionalPage() {

  const { orders ,shopDomain} = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  function getNumericId(gid: string) {
  return gid.split("/").pop(); // "6458854440983"
}



  // console.log(orders);

  return (
    <Page>
      <TitleBar title="Additional page" />
        <Card sectioned>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>Order Number</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Due Date</th>
              <th style={{ textAlign: "right", padding: "8px" }}>Due Payment</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                style={{ cursor: "pointer", borderBottom: "1px solid #eee" }}
                onClick={() =>{
                  const numericId = getNumericId(order.order_id);
                  window.open(
                    `https://${shopDomain}/admin/orders/${numericId}`,
                    "_blank"
                  )
                }
                }
              >
                <td style={{ padding: "8px" }}>
                  <Text>{order.order_number}</Text>
                </td>
                <td style={{ padding: "8px" }}>
                  <Text>{new Date(order.dueDate).toLocaleDateString()}</Text>
                </td>
                <td style={{ padding: "8px", textAlign: "right" }}>
                  <Text>{order.balanceAmount}</Text>
                </td>
                <td style={{ padding: "8px" }}>
                  <Text>{order.paymentStatus}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
        
    </Page>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}
