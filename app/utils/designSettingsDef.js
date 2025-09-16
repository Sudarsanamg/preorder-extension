const designSettingsDef = {
  name: "design_settings",   
  type: "design_settings",   
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
     { name: "Message Font Size", key: "messagefontsize", type: "single_line_text_field" },
    { name: "Message Color", key: "messagecolor", type: "color" },
    { name: "Font Family", key: "fontfamily", type: "single_line_text_field" },
    { name: "Button Style", key: "buttonstyle", type: "single_line_text_field" },
    { name: "Button Background Color", key: "buttonbackgroundcolor", type: "color" },
    { name: "Gradient Degree", key: "gradientdegree", type: "single_line_text_field" },
    { name: "Gradient Color 1", key: "gradientcolor1", type: "color" },
    { name: "Gradient Color 2", key: "gradientcolor2", type: "color" },
    { name: "Border Size", key: "bordersize", type: "single_line_text_field" },
    { name: "Border Color", key: "bordercolor", type: "color" },
    { name: "Spacing IT", key: "spacingit", type: "single_line_text_field" },
    { name: "Spacing IB", key: "spacingib", type: "single_line_text_field" },
    { name: "Spacing OT", key: "spacingot", type: "single_line_text_field" },
    { name: "Spacing OB", key: "spacingob", type: "single_line_text_field" },
    { name: "Border Radius", key: "borderradius", type: "single_line_text_field" },
    { name: "Preorder Message Color", key: "preordermessagecolor", type: "color" },
    { name: "Button Font Size", key: "buttonfontsize", type: "single_line_text_field" },
    { name: "Button Text Color", key: "buttontextcolor", type: "color" }
   
  ],
};

export default designSettingsDef;
