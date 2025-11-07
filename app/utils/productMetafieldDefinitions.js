const productMetafieldDefinitions = [
  {
    name: "campaign_id",
    namespace: "custom",
    key: "campaign_id",
    type: "single_line_text_field",
    description: "ID of the preorder campaign",
    ownerType: "PRODUCT",
  },
  {
    name: "preorder_units_sold",
    namespace: "custom",
    key: "preorder_units_sold",
    type: "number_integer",
    description: "Units sold for preorder",
    ownerType: "PRODUCT",
  },
  {
    name: "deposit_percent",
    namespace: "custom",
    key: "deposit_percent",
    type: "number_integer",
    description: "Deposit percentage for preorder",
    ownerType: "PRODUCT",
  },
  {
    name: "balance_due_date",
    namespace: "custom",
    key: "balance_due_date",
    type: "date",
    description: "Date when remaining balance is due",
    ownerType: "PRODUCT",
  },
  {
    name: "preorder_end_date",
    namespace: "custom",
    key: "preorder_end_date",
    type: "date_time",
    description: "Preorder end date and time",
    ownerType: "PRODUCT",
  },
  {
    name: "preorder_max_units",
    namespace: "custom",
    key: "preorder_max_units",
    type: "number_integer",
    description: "Maximum units available for preorder",
    ownerType: "PRODUCT",
  },
  {
    name: "preorder",
    namespace: "custom",
    key: "preorder",
    type: "boolean",
    description: "Whether the product is available for preorder",
    ownerType: "PRODUCT",
  }
];

export default productMetafieldDefinitions;


export const variantMetafieldDefinitions = [
  {
    name: "campaign_id",
    namespace: "custom",
    key: "campaign_id",
    type: "single_line_text_field",
    description: "ID of the preorder campaign (per variant)",
    ownerType: "PRODUCTVARIANT",
  },
  {
    name: "preorder_units_sold",
    namespace: "custom",
    key: "preorder_units_sold",
    type: "number_integer",
    description: "Units sold for preorder (per variant)",
    ownerType: "PRODUCTVARIANT",
  },
  {
    name: "deposit_percent",
    namespace: "custom",
    key: "deposit_percent",
    type: "number_integer",
    description: "Deposit percentage for preorder (per variant)",
    ownerType: "PRODUCTVARIANT",
  },
  {
    name: "balance_due_date",
    namespace: "custom",
    key: "balance_due_date",
    type: "date",
    description: "Date when remaining balance is due (per variant)",
    ownerType: "PRODUCTVARIANT",
  },

  {
    name: "preorder_end_date",
    namespace: "custom",
    key: "preorder_end_date",
    type: "date_time",
    description: "Preorder end date and time (per variant)",
    ownerType: "PRODUCTVARIANT",
  },
  {
    name: "preorder_max_units",
    namespace: "custom",
    key: "preorder_max_units",
    type: "number_integer",
    description: "Maximum units available for preorder (per variant)",
    ownerType: "PRODUCTVARIANT",
  },
  {
    name: "preorder",
    namespace: "custom",
    key: "preorder",
    type: "boolean",
    description: "Whether the variant is available for preorder",
    ownerType: "PRODUCTVARIANT",
  }
];

