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
      name:"object",
      key:"object",
      type:"json"
    }
  ],
};

export default preorderCampaignDef;
