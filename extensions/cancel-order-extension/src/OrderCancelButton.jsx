import {
  reactExtension,
  Button,
  useOrder,
} from "@shopify/ui-extensions-react/customer-account";

export default reactExtension(
  "customer-account.order-status.block.render",
  () => <CancelOrderButton />
);


function CancelOrderButton() {
  const order = useOrder();

  if (!order) return null;

  const handleCancel = async () => {
    const res = await fetch("/apps/cancel-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });

    const data = await res.json();
    if (data.success) {
      console.log("Order canceled:", data.order);
    } else {
      console.error("Error canceling order:", data.error);
    }
  };

  return (
    <Button kind="secondary" tone="critical" onPress={handleCancel}>
      Cancel Order
    </Button>
  );
}


