export const draftOrderInvoiceSendMutation = `
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

export const orderMarkAsPaid = `
    mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
      orderMarkAsPaid(input: $input) {
        order {
          id
          displayFinancialStatus
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

 export const CloseOrderMutation = `
    mutation closeOrder($id: ID!) {
      orderClose(input: { id: $id }) {
        order {
          id
          closed
        }
        userErrors {
          field
          message
        }
      }
    }
  `;