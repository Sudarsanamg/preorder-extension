import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  // BlockStack,
  // Button,
  // Card,
  // ColorPicker,
  hsbToHex,
  Page,
  // InlineStack,
  // Link,
  // Page,
  // Popover,
  // Select,
  // Text,
  // TextField,
  // Checkbox,
  // RadioButton,
  // RangeSlider,
  Spinner,
} from "@shopify/polaris";
import type { EmailSettings } from "app/types/type";
// import { hexToHsb } from "app/utils/color";
import {  useEffect, useState } from "react";
import {
  redirect,
  useLoaderData,
  useSubmit,
  useNavigate,
  // useFetcher,
  // useActionData,
  useNavigation
} from "@remix-run/react";
import {  getEmailSettingsStatus, getPreorderConfirmationEmailSettings, updateConfrimOrderEmailSettings, updateCustomEmailStatus } from "app/models/campaign.server";
import { authenticate } from "app/shopify.server";
import { isStoreRegistered } from "app/helper/isStoreRegistered";
import EmailDesignEditor from "app/components/EmailDesignEditor";

export async function loader({ request }: { request: Request }) {
  const { admin } = await authenticate.admin(request);

  const query = `{
    shop {
      id
      name
      myshopifyDomain
    }
  }`;

  const response = await admin.graphql(query);
  const data = await response.json();

  const shopId = data.data.shop.id; 
  const status  = await getEmailSettingsStatus(shopId); 
  const confrimOrderEmailSettingsData = await getPreorderConfirmationEmailSettings(shopId);
let parsedConfrimOrderEmailSettingsData: any;
if (typeof confrimOrderEmailSettingsData === "string") {
  parsedConfrimOrderEmailSettingsData = JSON.parse(confrimOrderEmailSettingsData || "{}");
} else {
  parsedConfrimOrderEmailSettingsData = confrimOrderEmailSettingsData || {};
}  return {shopId, status ,parsedConfrimOrderEmailSettingsData};
}

export const action = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.admin(request);
   const shopDomain = session.shop;
   const isStoreExist = await isStoreRegistered(shopDomain);
   if (!isStoreExist) {
     return Response.json(
       { success: false, error: "Store not found" },
       { status: 404 },
     );
   }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save-email-preorder-confirmation") {
    const shopId = formData.get("shopId");
    const designFields = formData.get("designFields");
    try {
      await updateConfrimOrderEmailSettings(String(shopId), JSON.parse(designFields as string));
    } catch (error) {
      console.error("Error saving email settings:", error);
      return { success: false, error: "Failed to save email settings." };
    }
   
  }
  if (intent === "change-status") {
  const status = formData.get("status"); 
  const shopId = formData.get("shopId");  
  // Convert status to boolean
  const statusBool = status === "true";

  try {
    await updateCustomEmailStatus(String(shopId),statusBool);
    return redirect("/app");
  } catch (error) {
    console.error("Error changing email settings status:", error);
    return redirect("/app");
  }
}
  return { success: false };
};




export default function EmailPreorderConfirmationSettings() {

  const shopify = useAppBridge();
  const navigate = useNavigate();
  const {shopId ,status ,parsedConfrimOrderEmailSettingsData }= useLoaderData<typeof loader>();
  const parsedSettings = parsedConfrimOrderEmailSettingsData
  const submit = useSubmit();
  const navigateTo = useNavigation();


  const options = [
    { label: "Use your theme fonts", value: "inherit" },
    { label: "Helvetica Neue", value: "Helvetica Neue" },
    { label: "Arial", value: "Arial" },
    { label: "Courier New", value: "Courier New" },
  ];
  const [subject, setSubject] = useState("Delivery update for order {order}");
  const initialSettings  :EmailSettings= {
subject: parsedSettings.subject,
  font: parsedSettings.font,

  storeName: parsedSettings.storeName,
  storeNameBold: parsedSettings.storeNameBold,
  storeNameColor: parsedSettings.storeNameColor,
  storeNameFontSize: parsedSettings.storeNameFontSize,

  subheading: parsedSettings.subheading,
  subheadingFontSize: parsedSettings.subheadingFontSize,
  subheadingColor: parsedSettings.subheadingColor,
  subheadingBold: parsedSettings.subheadingBold,

  description: parsedSettings.description,
  descriptionFontSize: parsedSettings.descriptionFontSize,
  descriptionColor: parsedSettings.descriptionColor,
  descriptionBold: parsedSettings.descriptionBold,

  productTitleFontSize: parsedSettings.productTitleFontSize,
  productTitleColor: parsedSettings.productTitleColor,
  productTitleBold: parsedSettings.productTitleBold,

  preorderText: parsedSettings.preorderText,
  fullPaymentText: parsedSettings.fullPaymentText,
  partialPaymentText: parsedSettings.partialPaymentText,
  paymentTextFontSize: parsedSettings.paymentTextFontSize,
  paymentTextColor: parsedSettings.paymentTextColor,
  paymentTextBold: parsedSettings.paymentTextBold,

  showCancelButton: parsedSettings.showCancelButton,
  cancelButtonText: parsedSettings.cancelButtonText,
  cancelButtonFontSize: parsedSettings.cancelButtonFontSize,
  cancelButtonTextColor: parsedSettings.cancelButtonTextColor,
  cancelButtonBold: parsedSettings.cancelButtonBold,
  cancelButtonBackgroundColor: parsedSettings.cancelButtonBackgroundColor,
  cancelButtonBorderSize: parsedSettings.cancelButtonBorderSize,
  cancelButtonBorderColor: parsedSettings.cancelButtonBorderColor,
  cancelButtonStyle: parsedSettings.cancelButtonStyle,
  cancelButtonGradientDegree: parsedSettings.cancelButtonGradientDegree,
  cancelButtonGradientColor1: parsedSettings.cancelButtonGradientColor1,
  cancelButtonGradientColor2: parsedSettings.cancelButtonGradientColor2,
  cancelButtonBorderRadius: parsedSettings.cancelButtonBorderRadius,
  }
 const [emailSettings, setEmailSettings] = useState<EmailSettings>(initialSettings);
 const [saveBarVisible, setSaveBarVisible] = useState(false);
  const [activePopover, setActivePopover] = useState<null | string>(null);
  
  const handleSave = () => {
    console.log('Saving');
    const formdata = new FormData();
    formdata.append("intent", "save-email-preorder-confirmation");
    formdata.append("subject", subject);
    formdata.append("designFields", JSON.stringify(emailSettings));
    formdata.append("shopId",shopId); 
    submit(formdata, { method: "post" });
    shopify.saveBar.hide('my-save-bar');
    setSaveBarVisible(false);
  };

  const handleDiscard = () => {
    // console.log('Discarding');
    shopify.saveBar.hide('my-save-bar');
    setSaveBarVisible(false);
  };

  const handleRangeSliderChange = (input: number) => {
    setEmailSettings((prev) => ({
      ...prev,
      cancelButtonGradientDegree: input.toString(),
    }));
  };

  const handleEmailSettingsChange = (
    field: keyof EmailSettings,
    value: string | boolean,
  ) => {
    setEmailSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleColorChange = (hsbColor: any, field: keyof EmailSettings) => {
    const hex = hsbToHex(hsbColor);
    setEmailSettings((prev) => ({
      ...prev,
      [field]: hex,
    }));
  };

 

  const togglePopover = (field: string) => {
    setActivePopover((prev) => (prev === field ? null : field));
  };



  useEffect(() => {
    const hasChanges =
      JSON.stringify(emailSettings) !== JSON.stringify(initialSettings) ||
      subject !== initialSettings.subject;

    if (hasChanges) {
      shopify.saveBar.show('my-save-bar');
      setSaveBarVisible(true);
    } else {
      shopify.saveBar.hide('my-save-bar');
      setSaveBarVisible(false);
    }
  }, [emailSettings, subject]);

  function handleSwitch(status: boolean) {
  console.log("Toggling status to:", status);
  const formData = new FormData();
  formData.append("intent", "change-status");
  formData.append("status", status.toString()); 
  formData.append("shopId", shopId);
  submit(formData, { method: "post" });
}


  return (
    <Page
      title="Preorder confirmation email"
     titleMetadata={
          <div>{navigateTo.state !== "idle" && <Spinner size="small" />}</div>
        }
      backAction={{ content: "Back",
        onAction: () => {
          if(saveBarVisible){
            shopify.saveBar.leaveConfirmation();
          }
          else{
            navigate('/app')
        }
      }}}
      primaryAction={{
        content: status === false ? "Turn On" : "Turn Off",
        onAction: () => {
          handleSwitch(!status);
        },
      }}
    >
       <SaveBar id="my-save-bar">
        <button variant="primary" onClick={handleSave}></button>
        <button onClick={handleDiscard}></button>
      </SaveBar>
      <EmailDesignEditor
      subject={subject}
      setSubject={setSubject}
      emailSettings={emailSettings}
      setEmailSettings={setEmailSettings}
      activePopover={activePopover}
      togglePopover={togglePopover}
      handleColorChange={handleColorChange}
      handleEmailSettingsChange={handleEmailSettingsChange}
      handleRangeSliderChange={handleRangeSliderChange}
      options={options}
    />
    </Page>
  );
}
