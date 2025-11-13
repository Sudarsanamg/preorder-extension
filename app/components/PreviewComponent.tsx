import { Card, Text, InlineStack } from "@shopify/polaris";
import { CampaignFields, DesignFields } from "app/types/type";
import React from "react";

interface CampaignPreviewProps {
  campaignData: CampaignFields;
  designFields: DesignFields;
  selectedDates: {
    duePaymentDate: Date;
  };
  activeButtonIndex?: number;
  formatDate: (date: Date) => string;
}

export const  PreviewComponent: React.FC<CampaignPreviewProps> = ({
  campaignData,
  designFields,
  selectedDates,
  activeButtonIndex = 0,
  formatDate,
}) => {
  const discountType = campaignData.discountType;
  const basePrice = 499.0;
  const hasDiscount =
    campaignData.discountValue !== 0;

  const discountedPrice =
    discountType === "PERCENTAGE" && campaignData.discountValue !== 0
      ? basePrice - (basePrice * campaignData.discountValue) / 100
      : Math.max(basePrice - campaignData.discountValue, 0);

  return (
    <div
      style={{
        position: "sticky",
        top: 20,
        maxWidth: "400px",
        minWidth: "400px",
        justifySelf: "flex-end",
      }}
    >
      <Card>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Text as="h4" variant="headingSm">
            Preview
          </Text>
        </div>

        {/* Product Info */}
        <div>
          <Text as="h1" variant="headingLg">
            White T-shirt
          </Text>

          <div style={{ marginTop: 10 }}>
            <InlineStack gap="200">
              <Text as="h1" variant="headingMd">
                {!hasDiscount ? (
                  <Text as="h1" variant="headingLg">
                    ${basePrice.toFixed(2)}
                  </Text>
                ) : (
                  <Text as="h1" variant="headingLg">
                    ${discountedPrice.toFixed(2)}
                  </Text>
                )}
              </Text>

              {hasDiscount && (
                <Text
                  as="h1"
                  variant="headingMd"
                  textDecorationLine="line-through"
                >
                  ${basePrice.toFixed(2)}
                </Text>
              )}
            </InlineStack>
          </div>
        </div>

        {/* Sizes */}
        <div style={{ marginTop: 10, marginBottom: 20 }}>
          <Text as="h1" variant="headingSm">
            Size
          </Text>
          <div style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                border: "1px solid black",
                borderRadius: 80,
                padding: "6px 12px",
                minWidth: "80px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "black", fontWeight: 500 }}>Small</span>
            </div>

            <div
              style={{
                border: "1px solid black",
                borderRadius: 80,
                padding: "6px 12px",
                minWidth: "80px",
                textAlign: "center",
                backgroundColor: "black",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "white", fontWeight: 500 }}>Medium</span>
            </div>
          </div>
        </div>

        {/* Preorder Button */}
        <div
          style={{
            marginTop: designFields.spacingOT + "px",
            marginBottom: designFields.spacingOB + "px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background:
                designFields.buttonStyle === "gradient"
                  ? `linear-gradient(${designFields.gradientDegree}deg, ${designFields.gradientColor1}, ${designFields.gradientColor2})`
                  : designFields.buttonBackgroundColor,
              borderRadius: designFields.borderRadius + "px",
              borderColor: designFields.borderColor,
              borderWidth: designFields.borderSize + "px",
              borderStyle: "solid",
              paddingTop: designFields.spacingIT + "px",
              paddingBottom: designFields.spacingIB + "px",
            }}
          >
            <span
              style={{
                color: designFields.buttonTextColor,
                fontWeight: "bold",
                fontSize: designFields.buttonFontSize + "px",
              }}
            >
              {campaignData.buttonText}
            </span>
          </div>
        </div>

        {/* Shipping message */}
        <div style={{ display: "flex", justifyContent: "center", padding: 5 }}>
          <Text as="h1" variant="headingMd">
            <h3
              style={{
                textAlign: "center",
                fontFamily:
                  designFields.fontFamily || "Helvetica Neue",
                fontSize:
                  designFields.messageFontSize
                    ? designFields.messageFontSize + "px"
                    : "16px",
                color: designFields.preorderMessageColor,
              }}
            >
              {campaignData.shippingMessage}
            </h3>
          </Text>
        </div>

        {/* Partial payment message */}
        {campaignData.paymentMode === "partial" && (
          <div style={{ textAlign: "center" }}>
            <Text as="h1" variant="headingMd">
              Pay $3.92 now and $35.28 will be charged on{" "}
              {formatDate(selectedDates.duePaymentDate)}
            </Text>
          </div>
        )}
      </Card>

      {/* Email Preview */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <div style={{ padding: 3, textAlign: "center", marginBottom: "10px" }}>
            <Text as="p" variant="headingSm">
              CART, CHECKOUT, EMAIL PREVIEW
            </Text>
          </div>
          <div style={{ display: "flex", gap: 25 }}>
            <div>
              <img
                src="https://essential-preorder.vercel.app/images/placeholder-preorder-product-img.jpg"
                alt=""
                height={80}
                style={{ borderRadius: "10px" }}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <p style={{ fontWeight: "bold", fontSize: "16px" }}>
                Baby Pink T-shirt
              </p>
              <p>
                {campaignData.paymentMode === "partial"
                  ? "Partial payment"
                  : "Pay in full"}
              </p>
              <p>
                {campaignData.preOrderNoteKey} :{" "}
                {campaignData.preOrderNoteValue}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
