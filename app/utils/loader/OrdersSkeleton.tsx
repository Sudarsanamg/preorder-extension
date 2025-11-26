import { Card, IndexTable } from "@shopify/polaris";

export function OrdersSkeleton() {
  return (
    <Card>
      <IndexTable
        resourceName={{ singular: "order", plural: "orders" }}
        itemCount={10}
        headings={[
          { title: "Order" },
          { title: "Due Date" },
          { title: "Balance Amount" },
          { title: "Payment status" },
          { title: "Fulfillment status" },
        ]}
      >
        {[...Array(10)].map((_, index) => (
          <IndexTable.Row id={`skeleton-${index}`} key={index} position={index}>
            <IndexTable.Cell>
              <div style={{ width: 80, height: 12, background: "#E3E3E3", }} />
            </IndexTable.Cell>
            <IndexTable.Cell>
              <div style={{ width: 60, height: 12, background: "#E3E3E3", borderRadius: 4 }} />
            </IndexTable.Cell>
            <IndexTable.Cell>
              <div style={{ width: 50, height: 12, background: "#E3E3E3", borderRadius: 4 }} />
            </IndexTable.Cell>
            <IndexTable.Cell>
              <div style={{ width: 70, height: 12, background: "#E3E3E3", borderRadius: 4 }} />
            </IndexTable.Cell>
            <IndexTable.Cell>
              <div style={{ width: 80, height: 12, background: "#E3E3E3", borderRadius: 4 }} />
            </IndexTable.Cell>
          </IndexTable.Row>
        ))}
      </IndexTable>
    </Card>
  );
}
