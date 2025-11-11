import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { Banner, Page,  } from "@shopify/polaris";
import type { EmailSettings } from "app/types/type";
// import { hexToHsb } from "app/utils/color";
import { useEffect, useMemo, useState } from "react";
import {
  redirect,
  useLoaderData,
  useSubmit,
  useNavigate,
  useNavigation,
  // useFetcher,
  // useActionData,
} from "@remix-run/react";
// import {  createOrUpdateShippingEmailSettings, getShippingEmailSettingsStatus, shippingEmailSettingsStatusUpdate } from "app/models/campaign.server";
import { authenticate } from "app/shopify.server";
import { isStoreRegistered } from "app/helper/isStoreRegistered";
import EmailDesignEditor from "app/components/EmailDesignEditor";
import {
  getShippingEmailSettings,
  updateShippingEmailSettings,
} from "app/models/campaign.server";
import { EmailSettingsSchema } from "app/utils/validator/zodValidateSchema";

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
  const shippingEmailSettingsData = await getShippingEmailSettings(shopId);
  // console.log(shippingEmailSettingsData, "shippingEmailSettingsData");
  let parsedConfrimOrderEmailSettingsData: any;
  if (typeof shippingEmailSettingsData === "string") {
    console.log(shippingEmailSettingsData, "shippingEmailSettingsData");
    parsedConfrimOrderEmailSettingsData = JSON.parse(
      shippingEmailSettingsData || "{}",
    );
  } else {
    parsedConfrimOrderEmailSettingsData = shippingEmailSettingsData || {};
  }
  return { shopId, status: false, parsedConfrimOrderEmailSettingsData };
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
      await updateShippingEmailSettings(
        String(shopId),
        JSON.parse(designFields as string),
      );
      return { success: true };
    } catch (error) {
      console.error("Error saving email settings:", error);
      return { success: false, error: "Failed to save email settings." };
    }
  }
  if (intent === "change-status") {
    const status = formData.get("status");
    // const shopId = formData.get("shopId");
    try {
      // await shippingEmailSettingsStatusUpdate(String(shopId), status == "true" ? "true" : "false");
      return { success: true, status: status === "true" };
    } catch (error) {
      console.error("Error changing email settings status:", error);
      redirect("/app");
    }
  }
  return { success: false };
};

export default function EmailPreorderConfirmationSettings() {
  const shopify = useAppBridge();
  const { shopId, status, parsedConfrimOrderEmailSettingsData } =
    useLoaderData<typeof loader>();
  // const parsedSettings :any = shippingEmailSettingsData
  console.log(status, "status");
  const parsedSettings = parsedConfrimOrderEmailSettingsData;
  // console.log("parsedSettings", parsedSettings);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";


  // const fetcher = useFetcher();
  // const actionData = useActionData();
  // console.log("Shop ID in component:", shopId);

  const submit = useSubmit();
  const options = [
    { label: "Use your theme fonts", value: "inherit" },
    { label: "Helvetica Neue", value: "Helvetica Neue" },
    { label: "Arial", value: "Arial" },
    { label: "Courier New", value: "Courier New" },
  ];
  const [subject, setSubject] = useState("Delivery update for order {order}");

  const initialSettings = useMemo<EmailSettings>(
    () => ({
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
    }),
    [parsedSettings],
  );

  const [errors, setErrors] = useState<string[]>([]);

  const [emailSettings, setEmailSettings] =
    useState<EmailSettings>(initialSettings);
  const [saveBarVisible, setSaveBarVisible] = useState(false);

  const [activePopover, setActivePopover] = useState<null | string>(null);

  const collectErrors = (obj: any) => {
    let messages: string[] = [];
    for (const key in obj) {
      if (Array.isArray(obj[key]?._errors)) {
        messages.push(...obj[key]._errors);
      }
      if (typeof obj[key] === "object" && obj[key] !== null) {
        messages.push(...collectErrors(obj[key]));
      }
    }
    return messages;
  };

  const handleSave = () => {
    const result = EmailSettingsSchema.safeParse(emailSettings);

    let errorMessages: string[] = [];
    if (!result.success) {
      const formatted = result.error.format();
      errorMessages = [...errorMessages, ...collectErrors(formatted)];
      setErrors(errorMessages);
      return;
    } else {
      setErrors([]);
    }

    try {
      console.log("Saving");
      const formdata = new FormData();
      formdata.append("intent", "save-email-preorder-confirmation");
      formdata.append("subject", subject);
      formdata.append("designFields", JSON.stringify(emailSettings));
      formdata.append("shopId", shopId);
      submit(formdata, { method: "post" });
      // shopify.saveBar.hide("my-save-bar");
      setSaveBarVisible(false);
      shopify.toast.show("Saved successfully");
    } catch (error) {
      console.error(error);
      shopify.toast.show("Failed to save");
    }
  };

  const handleDiscard = () => {
    setEmailSettings(initialSettings);
    console.log("Discarding");
    shopify.saveBar.hide("my-save-bar");
    setSaveBarVisible(false);
    setErrors([]);
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

  const togglePopover = (field: string) => {
    setActivePopover((prev) => (prev === field ? null : field));
  };

  useEffect(() => {
    const hasChanges =
      JSON.stringify(emailSettings) !== JSON.stringify(initialSettings);
    if (hasChanges && !saveBarVisible) {
      shopify.saveBar.show("my-save-bar");
      setSaveBarVisible(true);
    } else if(!hasChanges){
      shopify.saveBar.hide("my-save-bar");
      setSaveBarVisible(false);
    }
  }, [emailSettings, subject,initialSettings,shopify]);

  return (
    <Page
      title="Preorder confirmation email"
      backAction={{
        content: "Back",

        onAction: () => {
          if (saveBarVisible) {
            shopify.saveBar.leaveConfirmation();
          } else {
            navigate("/app");
          }
        },
      }}
      primaryAction={{
        content: "Save",
        onAction: handleSave,
        loading:isSaving,
        disabled:
          JSON.stringify(emailSettings) === JSON.stringify(initialSettings),
      }}
      secondaryActions={[
        {
          content: "Discard",
          onAction: handleDiscard,
          disabled: isSaving
        },
      ]}
    >
      {errors.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <Banner title="Please fix the following errors" tone="critical">
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </Banner>
        </div>
      )}
      <SaveBar id="my-save-bar">
        <button
          variant="primary"
          onClick={handleSave}
          loading={isSaving === true ? "" :false}
          disabled={
            JSON.stringify(emailSettings) === JSON.stringify(initialSettings)
          }
        ></button>
        <button onClick={handleDiscard} disabled={isSaving} ></button>
      </SaveBar>
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          marginBottom: 50,
        }}
      >
        {/* left */}
        <EmailDesignEditor
          subject={subject}
          setSubject={setSubject}
          emailSettings={emailSettings}
          setEmailSettings={setEmailSettings}
          activePopover={activePopover}
          togglePopover={togglePopover}
          handleEmailSettingsChange={handleEmailSettingsChange}
          // handleRangeSliderChange={handleRangeSliderChange}
          options={options}
        />
      </div>
    </Page>
  );
}
