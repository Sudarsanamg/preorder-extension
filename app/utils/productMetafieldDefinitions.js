const productMetafieldDefinitions = [
  {
    name: "campaign_id",
    namespace: "$app:preorder-extension",
    key: "campaign_id",
    type: "single_line_text_field",
    description: "ID of the preorder campaign",
    ownerType: "PRODUCT",
    access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "preorder_units_sold",
    namespace: "$app:preorder-extension",
    key: "preorder_units_sold",
    type: "number_integer",
    description: "Units sold for preorder",
    ownerType: "PRODUCT",
     access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "deposit_percent",
    namespace: "$app:preorder-extension",
    key: "deposit_percent",
    type: "number_integer",
    description: "Deposit percentage for preorder",
    ownerType: "PRODUCT",
    access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "balance_due_date",
    namespace: "$app:preorder-extension",
    key: "balance_due_date",
    type: "date",
    description: "Date when remaining balance is due",
    ownerType: "PRODUCT",
     access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "preorder_end_date",
    namespace: "$app:preorder-extension",
    key: "preorder_end_date",
    type: "date_time",
    description: "Preorder end date and time",
    ownerType: "PRODUCT",
     access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "preorder_max_units",
    namespace: "$app:preorder-extension",
    key: "preorder_max_units",
    type: "number_integer",
    description: "Maximum units available for preorder",
    ownerType: "PRODUCT",
     access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "preorder",
    namespace: "$app:preorder-extension",
    key: "preorder",
    type: "boolean",
    description: "Whether the product is available for preorder",
    ownerType: "PRODUCT",
    access: {
      admin: "MERCHANT_READ"
    }
  }
];

export default productMetafieldDefinitions;


export const variantMetafieldDefinitions = [
  {
    name: "campaign_id",
    namespace: "$app:preorder-extension",
    key: "campaign_id",
    type: "single_line_text_field",
    description: "ID of the preorder campaign (per variant)",
    ownerType: "PRODUCTVARIANT",
    access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "preorder_units_sold",
    namespace: "$app:preorder-extension",
    key: "preorder_units_sold",
    type: "number_integer",
    description: "Units sold for preorder (per variant)",
    ownerType: "PRODUCTVARIANT",
    access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "deposit_percent",
    namespace: "$app:preorder-extension",
    key: "deposit_percent",
    type: "number_integer",
    description: "Deposit percentage for preorder (per variant)",
    ownerType: "PRODUCTVARIANT",
     access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "balance_due_date",
    namespace: "$app:preorder-extension",
    key: "balance_due_date",
    type: "date",
    description: "Date when remaining balance is due (per variant)",
    ownerType: "PRODUCTVARIANT",
     access: {
      admin: "MERCHANT_READ"
    }
  },

  {
    name: "preorder_end_date",
    namespace: "$app:preorder-extension",
    key: "preorder_end_date",
    type: "date_time",
    description: "Preorder end date and time (per variant)",
    ownerType: "PRODUCTVARIANT",
     access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "preorder_max_units",
    namespace: "$app:preorder-extension",
    key: "preorder_max_units",
    type: "number_integer",
    description: "Maximum units available for preorder (per variant)",
    ownerType: "PRODUCTVARIANT",
     access: {
      admin: "MERCHANT_READ"
    }
  },
  {
    name: "preorder",
    namespace: "$app:preorder-extension",
    key: "preorder",
    type: "boolean",
    description: "Whether the variant is available for preorder",
    ownerType: "PRODUCTVARIANT",
     access: {
      admin: "MERCHANT_READ"
    }
  }
];

