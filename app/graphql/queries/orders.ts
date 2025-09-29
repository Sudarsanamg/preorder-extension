export const getOrdersFulfillmentStatus = `
query getOrdersFulfillmentStatus($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Order {
      id
      displayFulfillmentStatus
    }
  }
}
`;