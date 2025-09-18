const preorderCampaignDef = {
  name: "preorderCampaign",   
  type: "preordercampaign",   
  displayNameKey: "campaign_id",
  access: {
    storefront: "PUBLIC_READ",
  },
  fieldDefinitions: [
    {
      name: "Campaign ID",
      key: "campaign_id",
      type: "single_line_text_field",
    },
    {
      name: "Name",
      key: "name",
      type: "single_line_text_field",
    },
    {
      name: "Status",
      key: "status",
      type: "single_line_text_field",
    },
    {
      name: "Campaign Type",
      key: "campaigntype",
      type: "number_integer",
    },
    {
      name: "Button Text",
      key: "button_text",
      type: "single_line_text_field",
    },
    {
      name: "Shipping Message",
      key: "shipping_message",
      type: "single_line_text_field",
    },
    {
      name: "Payment Type",
      key: "payment_type",
      type: "single_line_text_field",
    },
    {
      name: "ppercent",
      key: "ppercent",
      type: "number_integer",
    },
    {
      name: "Payment Due Date",
      key: "paymentduedate",
      type: "date",
    },
    {
      name: "Campaign End Date",
      key: "campaign_end_date",
      type: "date_time",
    },
    {
      name: "Discount Type",
      key: "discount_type",
      type: "single_line_text_field",
    },
    {
      name: "Discount Percent",
      key: "discountpercent",
      type: "number_integer",
    },
    {
      name: "Discount Fixed",
      key: "discountfixed",
      type: "single_line_text_field",
    },
    {
      name: "Campaign Tags",
      key: "campaigntags",
      type: "single_line_text_field",
    }
  ],
};

export default preorderCampaignDef;
