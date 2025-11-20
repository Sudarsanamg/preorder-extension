const preorderCampaignDef = {
  name: "preorderCampaign",   
  type: "$app:preorder-extension",
  displayNameKey: "campaign_id",
  access: {
    storefront: "PUBLIC_READ",
    admin: "MERCHANT_READ",
  },
  fieldDefinitions: [
    {
      name: "Campaign ID",
      key: "campaign_id",
      type: "single_line_text_field",
    },
    {
      name:"object",
      key:"object",
      type: "json",
    }
  ],
   capabilities: {
      publishable: {
        enabled: true
      }
    },
};

export default preorderCampaignDef;
