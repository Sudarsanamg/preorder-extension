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

export const AddTagsToOrderMutation = `
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


export const draftOrderCreate = `
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

export const getOrderVaultedMethods = `
    query getOrderVaultedMethods($id: ID!) {
      order(id: $id) {
        paymentCollectionDetails {
          vaultedPaymentMethods {
            id
          }
          additionalPaymentCollectionUrl
        }
      }
    }
  `;