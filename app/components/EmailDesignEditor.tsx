import {
  BlockStack,
  Button,
  Card,
  Checkbox,
  ColorPicker,
  InlineStack,
  Link,
  Popover,
  RadioButton,
  RangeSlider,
  Select,
  Text,
  TextField,
  
} from "@shopify/polaris";
import React from "react";
// import { hsbToHex, hexToHsb } from "@shopify/polaris";
import {hexToHsb} from "../utils/color";

import { EmailSettings } from "app/types/type";


interface EmailDesignEditorProps {
  subject: string;
  setSubject: (value: string) => void;
  emailSettings: EmailSettings;
  setEmailSettings: React.Dispatch<React.SetStateAction<EmailSettings>>;
  activePopover: string | null;
  togglePopover: (id: string) => void;
  handleColorChange: (color: any, field: keyof EmailSettings) => void;
  handleRangeSliderChange: (value: number) => void;
  handleEmailSettingsChange: (field: keyof EmailSettings, value: string | boolean) => void;
  options: { label: string; value: string }[];
}

export default function EmailDesignEditor({
  subject,
  setSubject,
  emailSettings,
  setEmailSettings,
  activePopover,
  togglePopover,
  handleColorChange,
  handleRangeSliderChange,
  handleEmailSettingsChange,
  options,
}: EmailDesignEditorProps) {
    return (
          <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          marginBottom: 50,
        }}
      >
        {/* left */}
        <div style={{ flex: 1 }}>
          <BlockStack gap="300">
            <Card padding="800">
              <BlockStack gap="300">
                <div>
                  <Text as="h3" variant="bodyMd" fontWeight="medium">
                    Subject
                  </Text>
                  <TextField
                    label="Email subject"
                    value={subject}
                    onChange={setSubject}
                    autoComplete="off"
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Use {"{order}"} for order number
                  </Text>
                </div>

                {/* Email info */}
                <div>
                  <Text as="p" variant="bodySm">
                    Emails are sent from info@essentialpreorder.com.
                  </Text>
                  <Link url="/app/settings/email">Customise sender email</Link>
                </div>
              </BlockStack>
            </Card>
            <Card padding="800">
              <Select
                label="Font"
                options={options}
                onChange={(value) =>
                  setEmailSettings({ ...emailSettings, font: value })
                }
                value={emailSettings.font}
              />
            </Card>
            <Card>
              <BlockStack gap="300">
                <TextField
                  label="Store name"
                  value={emailSettings.storeName}
                  onChange={(value) =>
                    handleEmailSettingsChange("storeName", value)
                  }
                  autoComplete="off"
                />
                <InlineStack gap="200" wrap={false} align="center">
                  <Button
                    pressed={emailSettings.storeNameBold}
                    onClick={() => {
                      handleEmailSettingsChange(
                        "storeNameBold",
                        !emailSettings.storeNameBold,
                      );
                    }}
                  >
                    B
                  </Button>
                  <TextField
                    label="Store name"
                    labelHidden
                    value={emailSettings.storeNameFontSize}
                    onChange={(value) =>
                      handleEmailSettingsChange("storeNameFontSize", value)
                    }
                    autoComplete="off"
                    suffix={"px"}
                  />
                  {/* colour picker to change the text colour */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <Popover
                      active={activePopover === "storeNameColor"}
                      activator={
                        <div
                          style={{
                            height: 30,
                            width: 30,
                            backgroundColor: emailSettings.storeNameColor,
                            borderRadius: "8px",
                            border: "1px solid grey",
                          }}
                          onClick={() => togglePopover("storeNameColor")}
                        ></div>
                      }
                      autofocusTarget="first-node"
                      onClose={() => togglePopover("storeNameColor")}
                    >
                      <ColorPicker
                        onChange={(color) =>
                          handleColorChange(color, "storeNameColor")
                        }
                        color={hexToHsb(emailSettings.storeNameColor)}
                      />
                    </Popover>
                    <TextField
                      labelHidden
                      label="Store name"
                      autoComplete="off"
                      value={emailSettings.storeNameColor}
                      onChange={(value) => {
                        handleEmailSettingsChange("storeNameColor", value);
                      }}
                    />
                  </div>
                </InlineStack>
                <TextField
                  label="Subheading"
                  value={emailSettings.subheading}
                  onChange={(value) => {
                    handleEmailSettingsChange("subheading", value);
                  }}
                  autoComplete="off"
                />
                <p>Use for order number</p>
                <InlineStack gap="200" wrap={false} align="center">
                  <Button
                    pressed={emailSettings.subheadingBold}
                    onClick={() => {
                      handleEmailSettingsChange(
                        "subheadingBold",
                        !emailSettings.subheadingBold,
                      );
                    }}
                  >
                    B
                  </Button>
                  <TextField
                    label="Store name"
                    labelHidden
                    value={emailSettings.subheadingFontSize}
                    autoComplete="off"
                    suffix={"px"}
                    onChange={(value) =>
                      handleEmailSettingsChange("subheadingFontSize", value)
                    }
                  />
                  {/* colour picker to change the text colour */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <Popover
                      active={activePopover === "subheadingColor"}
                      activator={
                        <div
                          style={{
                            height: 30,
                            width: 30,
                            backgroundColor: emailSettings.subheadingColor,
                            borderRadius: "8px",
                            border: "1px solid grey",
                          }}
                          onClick={() => togglePopover("subheadingColor")}
                        ></div>
                      }
                      autofocusTarget="first-node"
                      onClose={() => togglePopover("subheadingColor")}
                    >
                      <ColorPicker
                        onChange={(color) =>
                          handleColorChange(color, "subheadingColor")
                        }
                        color={hexToHsb(emailSettings.subheadingColor)}
                      />
                    </Popover>
                    <TextField
                      labelHidden
                      label="Store name"
                      autoComplete="off"
                      value={emailSettings.subheadingColor}
                      onChange={(value) => {
                        handleEmailSettingsChange("subheadingColor", value);
                      }}
                    />
                  </div>
                </InlineStack>

                <TextField
                  label="Description"
                  value={emailSettings.description}
                  onChange={(value) => {
                    handleEmailSettingsChange("description", value);
                  }}
                  autoComplete="off"
                  multiline={4}
                />
                <p>Use {"{order}"} for order number</p>
                <InlineStack gap="200" wrap={false} align="center">
                  <Button
                    pressed={emailSettings.descriptionBold}
                    onClick={() => {
                      handleEmailSettingsChange(
                        "descriptionBold",
                        !emailSettings.descriptionBold,
                      );
                    }}
                  >
                    B
                  </Button>
                  <TextField
                    label="Store name"
                    labelHidden
                    value={emailSettings.descriptionFontSize}
                    onChange={(value) => {
                      handleEmailSettingsChange("descriptionFontSize", value);
                    }}
                    autoComplete="off"
                    suffix={"px"}
                  />
                  {/* colour picker to change the text colour */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <Popover
                      active={activePopover === "descriptionColor"}
                      activator={
                        <div
                          style={{
                            height: 30,
                            width: 30,
                            backgroundColor: emailSettings.descriptionColor,
                            borderRadius: "8px",
                            border: "1px solid grey",
                          }}
                          onClick={() => togglePopover("descriptionColor")}
                        ></div>
                      }
                      autofocusTarget="first-node"
                      onClose={() => togglePopover("descriptionColor")}
                    >
                      <ColorPicker
                        onChange={(color) =>
                          handleColorChange(color, "descriptionColor")
                        }
                        color={hexToHsb(emailSettings.descriptionColor)}
                      />
                    </Popover>
                    <TextField
                      labelHidden
                      label="Store name"
                      autoComplete="off"
                      value={emailSettings.descriptionColor}
                      onChange={(value) => {
                        handleEmailSettingsChange("descriptionColor", value);
                      }}
                    />
                  </div>
                </InlineStack>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  Product title style
                </Text>
                <InlineStack gap="200" wrap={false} align="center">
                  <Button
                    pressed={emailSettings.productTitleBold}
                    onClick={() => {
                      handleEmailSettingsChange(
                        "productTitleBold",
                        !emailSettings.productTitleBold,
                      );
                    }}
                  >
                    B
                  </Button>
                  <TextField
                    label="Store name"
                    labelHidden
                    value={emailSettings.productTitleFontSize}
                    autoComplete="off"
                    suffix={"px"}
                    onChange={(value) => {
                      handleEmailSettingsChange("productTitleFontSize", value);
                    }}
                  />
                  {/* colour picker to change the text colour */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <Popover
                      active={activePopover === "productTitleColor"}
                      activator={
                        <div
                          style={{
                            height: 30,
                            width: 30,
                            backgroundColor: emailSettings.productTitleColor,
                            borderRadius: "8px",
                            border: "1px solid grey",
                          }}
                          onClick={() => togglePopover("productTitleColor")}
                        ></div>
                      }
                      autofocusTarget="first-node"
                      onClose={() => togglePopover("productTitleColor")}
                    >
                      <ColorPicker
                        onChange={(color) =>
                          handleColorChange(color, "productTitleColor")
                        }
                        color={hexToHsb(emailSettings.productTitleColor)}
                      />
                    </Popover>
                    <TextField
                      labelHidden
                      label="Store name"
                      autoComplete="off"
                      value={emailSettings.productTitleColor}
                      onChange={(value) => {
                        handleEmailSettingsChange("productTitleColor",value)
                      }}
                    />
                  </div>
                </InlineStack>
                <TextField
                  label="Preorder Text"
                  value={emailSettings.preorderText}
                  onChange={(value) => {
                    handleEmailSettingsChange("preorderText",value)
                  }}
                  autoComplete="off"
                />
                <TextField
                  label="Full payment Text"
                  value={emailSettings.fullPaymentText}
                  onChange={(value) => {
                    handleEmailSettingsChange("fullPaymentText", value);
                  }}
                  autoComplete="off"
                />
                <TextField
                  label="Partial payment Text"
                  value={emailSettings.partialPaymentText}
                  onChange={(value) => {
                    handleEmailSettingsChange("partialPaymentText", value);
                  }}
                  autoComplete="off"
                />
              </BlockStack>
            </Card>
            {/* <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Button
                </Text>
                <Checkbox
                  label="Show cancel button"
                  checked={emailSettings.showCancelButton}
                  onChange={() => {
                    handleEmailSettingsChange(
                      "showCancelButton",
                      !emailSettings.showCancelButton,
                    );
                  }}
                />
                {emailSettings.showCancelButton && (
                  <div>

                
                <TextField
                  label="Button text"
                  value={emailSettings.cancelButtonText}
                  onChange={(value) => {
                    handleEmailSettingsChange("cancelButtonText", value);
                  }}               
                  autoComplete="off"
                />
                <Text as="p" variant="bodyMd" >
                  Opens up order cancelation page. Use {"{order}"} for order
                  number
                </Text>
                <div style={{marginTop:10,marginBottom:10}}>
                <Text variant="headingMd" as="h2">
                  Background
                </Text>
                </div>

                <BlockStack gap="200"> 

                <RadioButton
                  label="Single Colour Background" 
                  onChange={() => {
                    handleEmailSettingsChange("cancelButtonStyle", "solid");
                  }}
                  checked={emailSettings.cancelButtonStyle === "solid"}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Popover
                    active={activePopover === "cancelButtonBackgroundColor"}
                    activator={
                      <div
                        style={{
                          height: 30,
                          width: 30,
                          backgroundColor:
                            emailSettings.cancelButtonBackgroundColor,
                          borderRadius: "8px",
                          border: "1px solid grey",
                        }}
                        onClick={() =>
                          togglePopover("cancelButtonBackgroundColor")
                        }
                      ></div>
                    }
                    autofocusTarget="first-node"
                    onClose={() => togglePopover("cancelButtonBackgroundColor")}
                  >
                    <ColorPicker
                      onChange={(color) =>
                        handleColorChange(color, "cancelButtonBackgroundColor")
                      }
                      color={hexToHsb(
                        emailSettings.cancelButtonBackgroundColor,
                      )}
                    />
                  </Popover>
                  <TextField
                    label="cancelButtonBackgroundColor"
                    labelHidden
                    autoComplete="off"
                    value={emailSettings.cancelButtonBackgroundColor}
                    onChange={(value) => {
                      handleEmailSettingsChange(
                        "cancelButtonBackgroundColor",
                        value,
                      );
                    }}
                  />
                </div>
                <RadioButton
                  label="Gradient background" 
                  onChange={() => {
                    handleEmailSettingsChange("cancelButtonStyle", "gradient");
                  }}
                  checked={emailSettings.cancelButtonStyle === "gradient"}
                />
                {emailSettings.cancelButtonStyle === "gradient" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <RangeSlider
                      label="Gradient angle degree"
                      value={Number(emailSettings.cancelButtonGradientDegree)}
                      onChange={handleRangeSliderChange}
                      output
                    />
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Popover
                        active={activePopover === "cancelButtonGradientColor1"}
                        activator={
                          <div
                            style={{
                              height: 30,
                              width: 30,
                              backgroundColor:
                                emailSettings.cancelButtonGradientColor1,
                              borderRadius: "8px",
                              border: "1px solid grey",
                            }}
                            onClick={() =>
                              togglePopover("cancelButtonGradientColor1")
                            }
                          ></div>
                        }
                        autofocusTarget="first-node"
                        onClose={() =>
                          togglePopover("cancelButtonGradientColor1")
                        }
                      >
                        <ColorPicker
                          onChange={(color) =>
                            handleColorChange(
                              color,
                              "cancelButtonGradientColor1",
                            )
                          }
                          color={hexToHsb(
                            emailSettings.cancelButtonGradientColor1,
                          )}
                        />
                      </Popover>
                      <TextField
                        label="cancelButtonGradientColor1"
                        labelHidden
                        autoComplete="off"
                        value={emailSettings.cancelButtonGradientColor1}
                      />
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Popover
                        active={activePopover === "cancelButtonGradientColor2"}
                        activator={
                          <div
                            style={{
                              height: 30,
                              width: 30,
                              backgroundColor:
                                emailSettings.cancelButtonGradientColor2,
                              borderRadius: "8px",
                              border: "1px solid grey",
                            }}
                            onClick={() =>
                              togglePopover("cancelButtonGradientColor2")
                            }
                          ></div>
                        }
                        autofocusTarget="first-node"
                        onClose={() =>
                          togglePopover("cancelButtonGradientColor2")
                        }
                      >
                        <ColorPicker
                          onChange={(color) =>
                            handleColorChange(
                              color,
                              "cancelButtonGradientColor2",
                            )
                          }
                          color={hexToHsb(
                            emailSettings.cancelButtonGradientColor2,
                          )}
                        />
                      </Popover>
                      <TextField
                        label="cancelButtonGradientColor2"
                        labelHidden
                        autoComplete="off"
                        value={emailSettings.cancelButtonGradientColor2}
                      />
                    </div>
                  </div>
                )}

                </BlockStack>
                <BlockStack gap="200">
                <TextField
                  label="Corner radius"
                  value={emailSettings.cancelButtonBorderRadius}
                  suffix={"px"}
                  onChange={(value) => {
                    handleEmailSettingsChange(
                      "cancelButtonBorderRadius",
                      value,
                    );
                  }}
                  autoComplete="off"
                />
                <Text as="h3" variant="headingMd">
                  Border size and color
                </Text>
                <InlineStack gap="200" wrap={false}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <TextField
                      label="Border size and color"
                      labelHidden
                      suffix={"px"}
                      value={emailSettings.cancelButtonBorderSize}
                      onChange={(value) => {
                        handleEmailSettingsChange(
                          "cancelButtonBorderSize",
                          value,
                        );
                      }}
                      autoComplete="off"
                    />
                    <Popover
                      active={activePopover === "cancelButtonBorderColor"}
                      activator={
                        <div
                          style={{
                            height: 30,
                            width: 30,
                            backgroundColor:
                              emailSettings.cancelButtonBorderColor,
                            borderRadius: "8px",
                            border: "1px solid grey",
                          }}
                          onClick={() =>
                            togglePopover("cancelButtonBorderColor")
                          }
                        ></div>
                      }
                      autofocusTarget="first-node"
                      onClose={() => togglePopover("cancelButtonBorderColor")}
                    >
                      <ColorPicker
                        onChange={(color) =>
                          handleColorChange(color, "cancelButtonBorderColor")
                        }
                        color={hexToHsb(emailSettings.cancelButtonBorderColor)}
                      />
                    </Popover>
                    <TextField 
                    label="cancelButtonBorderColor"
                    labelHidden
                    autoComplete="off"
                    value={emailSettings.cancelButtonBorderColor} />
                  </div>
                </InlineStack>
                <Text as="h3" variant="headingMd">
                  Text style
                </Text>
                <InlineStack gap="200" wrap={false}>
                  <Button
                    pressed={emailSettings.cancelButtonBold}
                    onClick={() => {
                      handleEmailSettingsChange(
                        "cancelButtonBold",
                        !emailSettings.cancelButtonBold,
                      );
                    }}
                  >
                    B
                  </Button>
                  <TextField
                    label="Store name"
                    labelHidden

                    value={emailSettings.cancelButtonFontSize}
                    onChange={(value) => {
                      handleEmailSettingsChange("cancelButtonFontSize", value);
                    }}
                    autoComplete="off"
                    suffix={"px"}
                  />
                  {/* colour picker to change the text colour */}
                  {/* <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <Popover
                      active={activePopover === "cancelButtonTextColor"}
                      activator={
                        <div
                          style={{
                            height: 30,
                            width: 30,
                            backgroundColor:
                              emailSettings.cancelButtonTextColor,
                            borderRadius: "8px",
                            border: "1px solid grey",
                          }}
                          onClick={() => togglePopover("cancelButtonTextColor")}
                        ></div>
                      }
                      autofocusTarget="first-node"
                      onClose={() => togglePopover("cancelButtonTextColor")}
                    >
                      <ColorPicker
                        onChange={(color) =>
                          handleColorChange(color, "cancelButtonTextColor")
                        }
                        color={hexToHsb(emailSettings.cancelButtonTextColor)}
                      />
                    </Popover>
                    <TextField
                      label="cancelButtonTextColor"
                      labelHidden
                      autoComplete="off"
                      value={emailSettings.cancelButtonTextColor}
                      onChange={() => {}}
                    />
                  </div>
                </InlineStack>
                </BlockStack>
                  </div>
                )}
              </BlockStack>
            </Card> */} 
          </BlockStack>
        </div>
        {/* right */}
        <div
          style={{
            position: "sticky",
            top: 20,
            flex: 1,
            fontFamily: emailSettings.font,
            maxWidth:"400px",
          }}
        >
          <Card padding="800">
            <BlockStack gap="500">
              <div
                style={{
                  color: emailSettings.storeNameColor,
                  fontSize: `${emailSettings.storeNameFontSize}px`,
                }}
              >
                <Text
                  alignment="center"
                  as="h2"
                  fontWeight={emailSettings.storeNameBold ? "bold" : "regular"}
                >
                  {emailSettings.storeName}
                </Text>
              </div>
              <div
                style={{
                  color: emailSettings.subheadingColor,
                  fontSize: `${emailSettings.subheadingColor}px`,
                }}
              >
                <Text
                  alignment="center"
                  as="h4"
                  fontWeight={emailSettings.subheadingBold ? "bold" : "regular"}
                >
                  {emailSettings.subheading}
                </Text>
              </div>
              <div
                style={{
                  color: emailSettings.descriptionColor,
                  fontSize: `${emailSettings.descriptionFontSize}px`,
                }}
              >
                <Text
                  alignment="start"
                  as="h4"
                  fontWeight={
                    emailSettings.descriptionBold ? "bold" : "regular"
                  }
                >
                  {emailSettings.description}
                </Text>
              </div>
            </BlockStack>
            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div>
                <img
                  src="https://essential-preorder.vercel.app/images/placeholder-preorder-product-img.jpg"
                  alt=""
                  height={80}
                  style={{ borderRadius: 8, marginRight: 10 }}
                />
              </div>
              <div>
                <div style={{color: emailSettings.productTitleColor,
                  fontSize: `${emailSettings.productTitleFontSize}px`,}}>
                <Text as="h2" 
                  fontWeight={emailSettings.productTitleBold ? "bold" : "regular"}
                 
                >
                  Baby Pink T-shirt
                </Text>
                </div>
                <Text as="p">{emailSettings.preorderText}</Text>
                <Text as="p">{emailSettings.fullPaymentText}</Text>
              </div>
            </div>
            {emailSettings.showCancelButton  && (<div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  border: `${emailSettings.cancelButtonBorderSize}px solid ${emailSettings.cancelButtonBorderColor}`,
                  padding: 3,
                  borderRadius: `${emailSettings.cancelButtonBorderRadius}px`,
                  backgroundColor: emailSettings.cancelButtonStyle === "solid"
                    ? emailSettings.cancelButtonBackgroundColor
                    : ``,
                  background : emailSettings.cancelButtonStyle === "gradient" ? `linear-gradient(${emailSettings.cancelButtonGradientDegree}deg, ${emailSettings.cancelButtonGradientColor1}, ${emailSettings.cancelButtonGradientColor2})` : emailSettings.cancelButtonBackgroundColor,
                  cursor: "pointer",
                }}
              >
                <div style={{fontSize: `${emailSettings.cancelButtonFontSize}px`,color: emailSettings.cancelButtonTextColor, textAlign: "center", padding: "8px 16px", borderRadius: `${emailSettings.cancelButtonBorderRadius}px`,}}>
                <Text as="p" alignment="center"
                fontWeight={emailSettings.cancelButtonBold ? "bold" : "regular"}
                 >
                  Cancel order 6272079777777 
                </Text>
                </div>
              </div>
            </div>
            )}
          </Card>
        </div>
      </div>
    )
}