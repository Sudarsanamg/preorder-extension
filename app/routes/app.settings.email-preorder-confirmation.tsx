import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { Badge, Banner, InlineStack, Page,  } from "@shopify/polaris";
import type { EmailSettings } from "app/types/type";
import { useEffect, useMemo, useState } from "react";
import {
  useLoaderData,
  useSubmit,
  useNavigate,
  useNavigation,
  useActionData,

} from "@remix-run/react";
import {
  getEmailSettingsStatus,
  getPreorderConfirmationEmailSettings,
  updateConfrimOrderEmailSettings,
  updateCustomEmailStatus,
} from "app/models/campaign.server";
import { authenticate } from "app/shopify.server";
import { isStoreRegistered } from "app/helper/isStoreRegistered";
import EmailDesignEditor from "app/components/EmailDesignEditor";
import { EmailSettingsSchema } from "app/utils/validator/zodValidateSchema";
import { Knob } from "app/utils/sharedComponents/knob/Knob";

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
  const status = await getEmailSettingsStatus(shopId);
  const confrimOrderEmailSettingsData =
    await getPreorderConfirmationEmailSettings(shopId);
  let parsedConfrimOrderEmailSettingsData: any;
  if (typeof confrimOrderEmailSettingsData === "string") {
    parsedConfrimOrderEmailSettingsData = JSON.parse(
      confrimOrderEmailSettingsData || "{}",
    );
  } else {
    parsedConfrimOrderEmailSettingsData = confrimOrderEmailSettingsData || {};
  }
  return { shopId, status, parsedConfrimOrderEmailSettingsData };
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
    const status = formData.get("status");
    const statusBool = status === "true";

    try {
      await updateConfrimOrderEmailSettings(
        String(shopId),
        JSON.parse(designFields as string),
      );
      await updateCustomEmailStatus(String(shopId), statusBool);
      return { success: true };
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
      await updateCustomEmailStatus(String(shopId), statusBool);
      return { success: true };
      // return redirect("/app");
    } catch (error) {
      console.error("Error changing email settings status:", error);
      // return redirect("/app");
    }
  }
  return { success: false };
};

export default function EmailPreorderConfirmationSettings() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { shopId, status, parsedConfrimOrderEmailSettingsData } =
    useLoaderData<typeof loader>();
  const actionData :any = useActionData();
  const parsedSettings = parsedConfrimOrderEmailSettingsData;
  const submit = useSubmit();
  const [errors, setErrors] = useState<string[]>([]);
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [template, setTemplate] = useState(status);

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

  const handleSave = async () => {
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

    // setIsSaving(true);

    try {
      const formdata = new FormData();
      formdata.append("intent", "save-email-preorder-confirmation");
      formdata.append("subject", subject);
      formdata.append("designFields", JSON.stringify(emailSettings));
      formdata.append("shopId", shopId);
      formdata.append("status", template == false ? "false" : "true");
      submit(formdata, { method: "post" });

      // shopify.saveBar.hide("my-save-bar");
      setSaveBarVisible(false);
    } catch (error) {
      console.error(error);
      shopify.toast.show("Failed to save");
    } finally {
      // setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setEmailSettings(initialSettings);
    shopify.saveBar.hide("my-save-bar");
    setSaveBarVisible(false);
    setTemplate(status);
    setSubject(initialSettings.subject);
    setErrors([]);
  };

  // const handleRangeSliderChange = (input: number) => {
  //   setEmailSettings((prev) => ({
  //     ...prev,
  //     cancelButtonGradientDegree: input.toString(),
  //   }));
  // };

  const handleEmailSettingsChange = (
    field: keyof EmailSettings,
    value: string | boolean,
  ) => {
    setEmailSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // const handleColorChange = (hsbColor: any, field: keyof EmailSettings) => {
  //   const hex = hsbToHex(hsbColor);
  //   setEmailSettings((prev) => ({
  //     ...prev,
  //     [field]: hex,
  //   }));
  // };

  const togglePopover = (field: string) => {
    setActivePopover((prev) => (prev === field ? null : field));
  };

  useEffect(() => {
    const hasChanges =
      JSON.stringify(emailSettings) !== JSON.stringify(initialSettings) ||
      template !== status;

    if (hasChanges) {
      shopify.saveBar.show("my-save-bar");
      setSaveBarVisible(true);
    } else {
      shopify.saveBar.hide("my-save-bar");
      setSaveBarVisible(false);
    }
  }, [emailSettings, initialSettings, shopify, template]);

  useEffect(() => {
    if(actionData?.success){
      shopify.toast.show("Saved successfully");
    }
  },[actionData]);

  return (
    <Page
      title="Preorder confirmation email"
      titleMetadata={
        <InlineStack gap={"100"}>
          <Badge tone={template === false ? "warning" : "success"}>
            {template === false ? "Disabled" : "Enabled"}
          </Badge>

          <Knob
            selected={template ?? false}
            ariaLabel="Example knob"
            onClick={() => setTemplate(!template)}
          />
        </InlineStack>
      }
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
        // content: status === false ? "Turn On" : "Turn Off",
        // onAction: () => {
        //   handleSwitch(!status);
        // },
        content: "Save",
        onAction: handleSave,
        loading: isSaving,
        disabled:
          JSON.stringify(emailSettings) === JSON.stringify(initialSettings) &&
          template === status,
      }}
      secondaryActions={[
        {
          content: "Discard",
          onAction: handleDiscard,
          disabled: isSaving,
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
          loading={isSaving === true ? "" : false}
          disabled={
            JSON.stringify(emailSettings) === JSON.stringify(initialSettings) &&
            template === status
          }
        ></button>
        <button onClick={handleDiscard} disabled={isSaving}></button>
      </SaveBar>
      {/* <Card>
        <InlineStack align="space-between">
          <InlineStack align="start" gap="200" blockAlign="center">
            <Text as="p" variant="bodyMd">
             Send preorder confirmation email to the customer
            </Text>
            <Badge tone={template ? "success" : "attention"}>
              {template ? "Enabled" : "Disabled"}
            </Badge>
          </InlineStack>
          <Knob
            selected={template ?? false}
            ariaLabel="Example knob"
            onClick={() => setTemplate(!template)}
          />
        </InlineStack>
      </Card> */}

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
    </Page>
  );
}
