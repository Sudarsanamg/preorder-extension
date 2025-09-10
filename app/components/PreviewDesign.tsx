import React, { useCallback, useState } from "react";
import type { DesignFields } from "../types/type";
import {
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  ColorPicker,
  Divider,
  Popover,
  RadioButton,
  Select,
  Text,
  TextField,
  InlineStack,
  RangeSlider,
} from "@shopify/polaris";
import { hsbToHex, hexToHsb } from "../utils/color";

interface PreviewDesignProps {
  designFields: DesignFields;
  setDesignFields: React.Dispatch<React.SetStateAction<DesignFields>>;
  setTabSelected: React.Dispatch<React.SetStateAction<number>>;
}

export default function PreviewDesign({
  designFields,
  setDesignFields,
  setTabSelected
}: PreviewDesignProps) {
  const [selected, setSelected] = useState<"default" | "custom">("default");
  const options = [
    { label: "Use your theme fonts", value: "inherit" },
    { label: "Helvetica Neue", value: "Helvetica Neue" },
    { label: "Arial", value: "Arial" },
    { label: "Courier New", value: "Courier New" },
  ];
  const [color, setColor] = useState({
    hue: 120,
    brightness: 1,
    saturation: 1,
  });

  const [activePopover, setActivePopover] = useState<null | string>(null);
  const handleRangeSliderChange = (input: number) => {
    setDesignFields((prev) => ({
      ...prev,
      gradientDegree: input.toString(),
    }));
  };

  const handleColorChange = (
    field: keyof typeof designFields,
    hsbColor: any,
  ) => {
    const hex = hsbToHex(hsbColor);
    setDesignFields((prev) => ({
      ...prev,
      [field]: hex,
    }));
  };

  const togglePopover = (field: string) => {
    setActivePopover((prev) => (prev === field ? null : field));
  };

  return (
    <div>
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2" fontWeight="bold">
            Preorder Button
          </Text>
          <ButtonGroup variant="segmented" fullWidth>
            <Button
              pressed={selected === "default"}
              onClick={() => setSelected("default")}
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
                      height: 40,
                      width: 40,
                      backgroundColor: designFields.buttonBackgroundColor,
                      borderRadius: "8px",
                    }}
                    onClick={() => togglePopover("buttonBackgroundColor")}
                  ></div>
                }
                autofocusTarget="first-node"
                onClose={() => togglePopover("buttonBackgroundColor")}
              >
                <ColorPicker
                  onChange={(color) =>
                    handleColorChange("buttonBackgroundColor", color)
                  }
                  color={hexToHsb(designFields.buttonBackgroundColor)}
                />
              </Popover>
              <TextField
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
            <div style={{ display: "flex",flexDirection: "column", gap: 10 }}> 
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
                      height: 40,
                      width: 40,
                      backgroundColor: designFields.gradientColor1,
                      borderRadius: "8px",
                    }}
                    onClick={() => togglePopover("gradientColor1")}
                  ></div>
                }
                autofocusTarget="first-node"
                onClose={() => togglePopover("gradientColor1")}
              >
                <ColorPicker
                  onChange={(color) =>
                    handleColorChange("gradientColor1", color)
                  }
                  color={hexToHsb(designFields.gradientColor1)}
                />
              </Popover>
              <TextField value={designFields.gradientColor1} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Popover
                active={activePopover === "gradientColor2"}
                activator={
                  <div
                    style={{
                      height: 40,
                      width: 40,
                      backgroundColor: designFields.gradientColor2,
                      borderRadius: "8px",
                    }}
                    onClick={() => togglePopover("gradientColor2")}
                  ></div>
                }
                autofocusTarget="first-node"
                onClose={() => togglePopover("gradientColor2")}
              >
                <ColorPicker
                  onChange={(color) =>
                    handleColorChange("gradientColor2", color)
                  }
                  color={hexToHsb(designFields.gradientColor2)}
                />
              </Popover>
              <TextField value={designFields.gradientColor2} />
            </div>
            </div>)}

            <Text>Border size and color</Text>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField 
              suffix="px"
              onChange={(value)=>{
                setDesignFields((prev) => ({
                  ...prev,
                  borderSize :value
                }))
              }}
              value={designFields.borderSize}
               />
              {/* <ColorPicker onChange={setColor} color={color} /> */}

              <Popover
                active={activePopover === "borderColor"}
                activator={
                  <div
                    style={{
                      height: 40,
                      width: 40,
                      backgroundColor: designFields.borderColor,
                      borderRadius: "8px",
                    }}
                    onClick={() => togglePopover("borderColor")}
                  ></div>
                }
                autofocusTarget="first-node"
                onClose={() => togglePopover("borderColor")}
              >
                <ColorPicker 
                onChange={(color) =>
                handleColorChange("borderColor", color)
              }
                color={hexToHsb(designFields.borderColor)}
                 />
              </Popover>
              <TextField  value={designFields.borderColor}/>
            </div>

            <Text variant="bodyMd" as="p">
              Corner radius
            </Text>
            <TextField suffix="px" onChange={(value) => setDesignFields((prev) => ({ ...prev, borderRadius: value }))}  value={designFields.borderRadius}/>
            <Divider />

            <Text>Text</Text>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <TextField suffix="px" onChange={(value) => setDesignFields((prev) => ({ ...prev, buttonFontSize: value }))} value={designFields.buttonFontSize} />

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Popover
                  active={activePopover === "buttonTextColor"}
                  activator={
                    <div
                      style={{
                        height: 40,
                        width: 40,
                        backgroundColor: designFields.buttonTextColor,
                        borderRadius: "8px",
                      }}
                      onClick={() => togglePopover("buttonTextColor")}
                    ></div>
                  }
                  autofocusTarget="first-node"
                  onClose={() => togglePopover("buttonTextColor")}
                >
                  <ColorPicker 
                  onChange={(color) =>
                  handleColorChange("buttonTextColor", color)
                }
                  color={hexToHsb(designFields.buttonTextColor)}
                   />
                </Popover>
                <TextField  value={designFields.buttonTextColor}/>
              </div>
            </div>
            <Divider />
            <Text as="h3">Spacing</Text>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField label="Inside top" suffix="px" value={designFields.spacingIT} onChange={(value) => setDesignFields((prev) => ({ ...prev, spacingIT: value }))} />
              <TextField label="Inside bottom" suffix="px"  value={designFields.spacingIB} onChange={(value) => setDesignFields((prev) => ({ ...prev, spacingIB: value }))}/>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField label="Outside top"  value={designFields.spacingOT} onChange={(value) => setDesignFields((prev) => ({ ...prev, spacingOT: value }))} suffix="px" />
              <TextField label="Outside bottom" suffix="px"  value={designFields.spacingOB} onChange={(value) => setDesignFields((prev) => ({ ...prev, spacingOB: value }))} />
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
              suffix="px"
              value={designFields.messageFontSize}
              onChange={(value) =>
                setDesignFields((pre) => ({ ...pre, messageFontSize: value }))
              }
            />

            <Popover
              active={activePopover === "preorderMessageColor"}
              activator={
                <div
                  style={{
                    height: 40,
                    width: 40,
                    backgroundColor: designFields.preorderMessageColor,
                    borderRadius: "8px",
                  }}
                  onClick={() => togglePopover("preorderMessageColor")}
                ></div>
              }
              autofocusTarget="first-node"
              onClose={() => togglePopover("preorderMessageColor")}
            >
              <ColorPicker
                onChange={(color) =>
                  handleColorChange("preorderMessageColor", color)
                }
                color={hexToHsb(designFields.preorderMessageColor)}
              />
            </Popover>
            <TextField
              value={designFields.preorderMessageColor}
              onChange={() => {}}
            />
          </div>
        </BlockStack>
      </Card>
      {/* )} */}

      <Card>
        <Button fullWidth onClick={()=>setTabSelected(2)}>Continue to products</Button>
      </Card>
    </div>
  );
}
