import React, { useState } from "react";
import type { DesignFields } from "../types/type";
import {
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  Divider,
  Popover,
  RadioButton,
  Select,
  Text,
  TextField,
  RangeSlider,
} from "@shopify/polaris";
import * as reactColor from "react-color";
const SketchPicker = reactColor.SketchPicker;

interface PreviewDesignProps {
  designFields: DesignFields;
  setDesignFields: React.Dispatch<React.SetStateAction<DesignFields>>;
  setTabSelected: React.Dispatch<React.SetStateAction<number>>;
}

export default function PreviewDesign({
  designFields,
  setDesignFields,
  setTabSelected,
}: PreviewDesignProps) {
  const initialDesignRef = React.useRef(designFields);
  const [selected, setSelected] = useState<"default" | "custom">("default");
  const options = [
    { label: "Use your theme fonts", value: "inherit" },
    { label: "Helvetica Neue", value: "Helvetica Neue" },
    { label: "Arial", value: "Arial" },
    { label: "Courier New", value: "Courier New" },
  ];

  const [activePopover, setActivePopover] = useState<null | string>(null);
  const handleRangeSliderChange = (input: number) => {
    setDesignFields((prev) => ({
      ...prev,
      gradientDegree: input.toString(),
    }));
  };

  const handleColorChange = (
    field: keyof typeof designFields,
    colorResult: any,
  ) => {
    const hex = colorResult.hex;
    setDesignFields((prev) => ({
      ...prev,
      [field]: hex,
    }));
  };

  const togglePopover = (field: string) => {
    setActivePopover((prev) => (prev === field ? null : field));
  };

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2" fontWeight="bold">
            Preorder Button
          </Text>
          <ButtonGroup variant="segmented" fullWidth>
            <Button
              pressed={selected === "default"}
              onClick={() => {
                setDesignFields(initialDesignRef.current);
                setSelected("default");
              }}
              size="large"
            >
              Default
            </Button>
            <Button
              pressed={selected === "custom"}
              onClick={() => setSelected("custom")}
              size="large"
            >
              Custom
            </Button>
          </ButtonGroup>
          <Text variant="bodyMd" as="p">
            ‘Preorder’ button will look like ‘Add to cart’ button.
          </Text>
        </BlockStack>
      </Card>

      {selected === "custom" && (
        <Card>
          <BlockStack gap="300">
            <Text as="h3">Button background</Text>
            <RadioButton
              label="Single Colour Background"
              onChange={() => {
                setDesignFields((prev) => ({
                  ...prev,
                  buttonStyle: "single",
                }));
              }}
              checked={designFields.buttonStyle === "single"}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Popover
                active={activePopover === "buttonBackgroundColor"}
                activator={
                  <div
                    style={{
                      height: 30,
                      width: 30,
                      backgroundColor: designFields.buttonBackgroundColor,
                      borderRadius: "8px",
                      border: "1px solid gray",
                    }}
                    onClick={() => togglePopover("buttonBackgroundColor")}
                  ></div>
                }
                autofocusTarget="first-node"
                onClose={() => togglePopover("buttonBackgroundColor")}
              >
                <div style={{ pointerEvents: "auto" }}>
                  <SketchPicker
                    color={designFields.buttonBackgroundColor}
                    onChange={(color: any) =>
                      handleColorChange("buttonBackgroundColor", color)
                    }
                  />
                </div>
              </Popover>
              <TextField
                label="Color"
                labelHidden
                autoComplete="off"
                value={designFields.buttonBackgroundColor}
                onChange={() => {}}
              />
            </div>
            <RadioButton
              label="Gradient background"
              onChange={() => {
                setDesignFields((prev) => ({
                  ...prev,
                  buttonStyle: "gradient",
                }));
              }}
              checked={designFields.buttonStyle === "gradient"}
            />

            {designFields.buttonStyle === "gradient" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <RangeSlider
                  label="Gradient angle degree"
                  value={Number(designFields.gradientDegree)}
                  onChange={handleRangeSliderChange}
                  output
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Popover
                    active={activePopover === "gradientColor1"}
                    activator={
                      <div
                        style={{
                          height: 30,
                          width: 30,
                          backgroundColor: designFields.gradientColor1,
                          borderRadius: "8px",
                          border: "1px solid gray",
                        }}
                        onClick={() => togglePopover("gradientColor1")}
                      ></div>
                    }
                    autofocusTarget="first-node"
                    onClose={() => togglePopover("gradientColor1")}
                  >
                    <div style={{ pointerEvents: "auto" }}>
                      <SketchPicker
                        color={designFields.gradientColor1}
                        onChange={(color: any) =>
                          handleColorChange("gradientColor1", color)
                        }
                      />
                    </div>
                  </Popover>
                  <TextField
                    label="Color"
                    labelHidden
                    autoComplete="off"
                    value={designFields.gradientColor1}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Popover
                    active={activePopover === "gradientColor2"}
                    activator={
                      <div
                        style={{
                          height: 30,
                          width: 30,
                          backgroundColor: designFields.gradientColor2,
                          borderRadius: "8px",
                          border: "1px solid gray",
                        }}
                        onClick={() => togglePopover("gradientColor2")}
                      ></div>
                    }
                    autofocusTarget="first-node"
                    onClose={() => togglePopover("gradientColor2")}
                  >
                    <div style={{ pointerEvents: "auto" }}>
                      <SketchPicker
                        color={designFields.gradientColor2}
                        onChange={(color: any) =>
                          handleColorChange("gradientColor2", color)
                        }
                      />
                    </div>
                  </Popover>
                  <TextField
                    label="Color"
                    labelHidden
                    autoComplete="off"
                    value={designFields.gradientColor2}
                  />
                </div>
              </div>
            )}

            <Text as="h5">Border size and color</Text>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField
                label="Color"
                labelHidden
                autoComplete="off"
                suffix="px"
                onChange={(value) => {
                  if (isNaN(Number(value))) return;
                  setDesignFields((prev) => ({
                    ...prev,
                    borderSize: value,
                  }));
                }}
                value={designFields.borderSize}
                error={
                  designFields.borderSize === ""
                    ? "This field is required"
                    : Number(designFields.borderSize) <= 0 ||
                        Number(designFields.borderSize) > 50
                      ? "Border size must be between 1 and 50"
                      : ""
                }
              />
              {/* <ColorPicker onChange={setColor} color={color} /> */}

              <Popover
                active={activePopover === "borderColor"}
                activator={
                  <div
                    style={{
                      height: 30,
                      width: 30,
                      backgroundColor: designFields.borderColor,
                      borderRadius: "8px",
                      border: "1px solid gray",
                    }}
                    onClick={() => togglePopover("borderColor")}
                  ></div>
                }
                autofocusTarget="first-node"
                onClose={() => togglePopover("borderColor")}
              >
                <div style={{ pointerEvents: "auto" }}>
                  <SketchPicker
                    color={designFields.borderColor}
                    onChange={(color: any) =>
                      handleColorChange("borderColor", color)
                    }
                  />
                </div>
              </Popover>
              <TextField
                label="Color"
                labelHidden
                autoComplete="off"
                value={designFields.borderColor}
              />
            </div>

            <Text variant="bodyMd" as="p">
              Corner radius
            </Text>
            <TextField
              label="Color"
              labelHidden
              autoComplete="off"
              suffix="px"
              onChange={(value) => {
                if (isNaN(Number(value))) return;
                setDesignFields((prev) => ({ ...prev, borderRadius: value }));
              }}
              value={designFields.borderRadius}
              error={
                designFields.borderRadius === ""
                  ? "This field is required"
                  : Number(designFields.borderRadius) <= 0 ||
                      Number(designFields.borderRadius) > 100
                    ? "Border radius must be between 1 and 100"
                    : ""
              }
            />
            <Divider />

            <Text as="h5">Button Text</Text>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <TextField
                label="Color"
                labelHidden
                autoComplete="off"
                suffix="px"
                onChange={(value) => {
                  if (isNaN(Number(value))) return;
                  setDesignFields((prev) => ({
                    ...prev,
                    buttonFontSize: value,
                  }));
                }}
                value={designFields.buttonFontSize}
                error={
                  designFields.buttonFontSize === ""
                    ? "This field is required"
                    : Number(designFields.buttonFontSize) <= 0 ||
                        Number(designFields.buttonFontSize) > 50
                      ? "Font size must be between 1 and 50"
                      : ""
                }
              />

              {/* <div style={{ display: "flex", gap: 10, flexShrink: 0 }}> */}
                <Popover
                  active={activePopover === "buttonTextColor"}
                  activator={
                    <div
                      style={{
                        height: 30,
                        width: 30,
                        backgroundColor: designFields.buttonTextColor,
                        borderRadius: "8px",
                        border: "1px solid gray",
                      }}
                      onClick={() => togglePopover("buttonTextColor")}
                    ></div>
                  }
                  autofocusTarget="first-node"
                  onClose={() => togglePopover("buttonTextColor")}
                >
                  <div style={{ pointerEvents: "auto" }}>
                    <SketchPicker
                      color={designFields.buttonTextColor}
                      onChange={(color: any) =>
                        handleColorChange("buttonTextColor", color)
                      }
                    />
                  </div>
                </Popover>
                <TextField
                  label="Color"
                  labelHidden
                  autoComplete="off"
                  value={designFields.buttonTextColor}
                />
              {/* </div> */}
            </div>
            <Divider />
            <Text as="h3">Spacing</Text>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField
                label="Inside top"
                autoComplete="off"
                suffix="px"
                value={designFields.spacingIT}
                onChange={(value) => {
                  if (isNaN(Number(value))) return;
                  setDesignFields((prev) => ({ ...prev, spacingIT: value }));
                }}
                error={
                  designFields.spacingIT === ""
                    ? "This field is required"
                    : Number(designFields.spacingIT) <= 0 ||
                        Number(designFields.spacingIT) > 50
                      ? "Spacing must be between 1 and 50"
                      : ""
                }
              />
              <TextField
                label="Inside bottom"
                autoComplete="off"
                suffix="px"
                value={designFields.spacingIB}
                onChange={(value) => {
                  if (isNaN(Number(value))) return;
                  setDesignFields((prev) => ({ ...prev, spacingIB: value }));
                }}
                error={
                  designFields.spacingIB === ""
                    ? "This field is required"
                    : Number(designFields.spacingIB) <= 0 ||
                        Number(designFields.spacingIB) > 50
                      ? "Spacing must be between 1 and 50"
                      : ""
                }
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField
                label="Outside top"
                autoComplete="off"
                value={designFields.spacingOT}
                onChange={(value) => {
                  if (isNaN(Number(value))) return;
                  setDesignFields((prev) => ({ ...prev, spacingOT: value }));
                }}
                error={
                  designFields.spacingOT === ""
                    ? "This field is required"
                    : Number(designFields.spacingOT) <= 0 ||
                        Number(designFields.spacingOT) > 50
                      ? "Spacing must be between 1 and 50"
                      : ""
                }
                suffix="px"
              />
              <TextField
                label="Outside bottom"
                suffix="px"
                autoComplete="off"
                value={designFields.spacingOB}
                onChange={(value) => {
                  if (isNaN(Number(value))) return;
                  setDesignFields((prev) => ({ ...prev, spacingOB: value }));
                }}
                error={
                  designFields.spacingOB === ""
                    ? "This field is required"
                    : Number(designFields.spacingOB) <= 0 ||
                        Number(designFields.spacingOB) > 50
                      ? "Spacing must be between 1 and 50"
                      : ""
                }
              />
            </div>
          </BlockStack>
        </Card>
      )}
      {/* {selected === "default" && ( */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2" fontWeight="bold">
            Typography
          </Text>
          <Select
            label="Font"
            options={options}
            onChange={(value) =>
              setDesignFields((pre) => ({ ...pre, fontFamily: value }))
            }
            value={designFields.fontFamily}
          />
          <Text variant="bodyMd" as="p">
            Theme fonts are not available in the preview mode. Publish item to
            preview it in store.
          </Text>
          <Text variant="bodyMd" as="p">
            Preorder message
          </Text>
          <div style={{ display: "flex", gap: 10 }}>
            <TextField
              label="Color"
              labelHidden
              autoComplete="off"
              suffix="px"
              value={designFields.messageFontSize}
              onChange={(value) => {
                if (isNaN(Number(value))) return;
                setDesignFields((pre) => ({ ...pre, messageFontSize: value }));
              }}
              error={
                designFields.messageFontSize === ""
                  ? "This field is required"
                  : Number(designFields.messageFontSize) <= 0 ||
                      Number(designFields.messageFontSize) > 50
                    ? "Font size must be between 1 and 50"
                    : ""
              }
            />

            <Popover
              active={activePopover === "preorderMessageColor"}
              activator={
                <div
                  style={{
                    height: 30,
                    width: 30,
                    backgroundColor: designFields.preorderMessageColor,
                    borderRadius: "8px",
                    border: "1px solid gray",
                  }}
                  onClick={() => togglePopover("preorderMessageColor")}
                ></div>
              }
              autofocusTarget="first-node"
              onClose={() => togglePopover("preorderMessageColor")}
            >
              <div style={{ pointerEvents: "auto" }}>
                <SketchPicker
                  color={designFields.preorderMessageColor}
                  onChange={(color: any) =>
                    handleColorChange("preorderMessageColor", color)
                  }
                />
              </div>
            </Popover>
            <TextField
              label="Color"
              labelHidden
              autoComplete="off"
              value={designFields.preorderMessageColor}
              onChange={() => {}}
            />
          </div>
        </BlockStack>
      </Card>
      {/* )} */}

      <div className="hidden md:flex justify-end ">
        <div className=" justify-end mr-3">
          <Button onClick={() => setTabSelected(0)} variant="secondary">
            Back
          </Button>
        </div>

        <div className=" justify-end">
          <Button onClick={() => setTabSelected(2)} variant="primary">
            Next
          </Button>
        </div>
      </div>
    </BlockStack>
  );
}
