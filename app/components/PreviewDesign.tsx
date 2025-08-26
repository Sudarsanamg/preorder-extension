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

interface PreviewDesignProps {
  designFields: DesignFields;
  setDesignFields: React.Dispatch<React.SetStateAction<DesignFields>>;
}

export default function PreviewDesign({
  designFields,
  setDesignFields,
}: PreviewDesignProps) {
  const [selected, setSelected] = useState<"default" | "custom">("default");
  const options = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "lastWeek" },
  ];
  const [color, setColor] = useState({
    hue: 120,
    brightness: 1,
    saturation: 1,
  });

  const [active, setActive] = useState(false);

  const toggleActive = () => setActive((active) => !active);
  const [rangeValue, setRangeValue] = useState(32);

  const handleRangeSliderChange = useCallback(
    (value: number) => setRangeValue(value),
    [],
  );

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
              label="Single Colour Background" // checked={value === 'disabled'}
              id="disabled"
              name="accounts"
              // onChange={handleChange}
            />
            <RadioButton
              label="Gradient background" // checked={value === 'disabled'}
              id="disabled"
              name="accounts"
              // onChange={handleChange}
            />

            <RangeSlider
              label="Gradient angle degree"
              value={rangeValue}
              onChange={handleRangeSliderChange}
              output
            />
            <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Popover
              active={active}
              activator={
                <div
                  style={{
                    height: 40,
                    width: 40,
                    backgroundColor: "black",
                    borderRadius: "8px",
                  }}
                  onClick={toggleActive}
                ></div>
              }
              autofocusTarget="first-node"
              onClose={toggleActive}
            >
              <ColorPicker onChange={setColor} color={color} />
            </Popover>
            <TextField />
            </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Popover
              active={active}
              activator={
                <div
                  style={{
                    height: 40,
                    width: 40,
                    backgroundColor: "black",
                    borderRadius: "8px",
                  }}
                  onClick={toggleActive}
                ></div>
              }
              autofocusTarget="first-node"
              onClose={toggleActive}
            >
              <ColorPicker onChange={setColor} color={color} />
            </Popover>
            <TextField />
            </div>

            <Text>Border size and color</Text>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField />
              {/* <ColorPicker onChange={setColor} color={color} /> */}

              <Popover
                active={active}
                activator={
                  <div
                    style={{
                      height: 40,
                      width: 40,
                      backgroundColor: "black",
                      borderRadius: "8px",
                    }}
                    onClick={toggleActive}
                  ></div>
                }
                autofocusTarget="first-node"
                onClose={toggleActive}
              >
                <ColorPicker onChange={setColor} color={color} />
              </Popover>
              <TextField />
            </div>

            <Text variant="bodyMd" as="p">
              Corner radius
            </Text>
            <TextField suffix="px" />
            <Divider />

            <Text>Text</Text>
            <div style={{ display: "flex", gap: 10 , alignItems:'center' }}>
              <TextField suffix="px" />

              <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Popover
                active={active}
                activator={
                  <div
                    style={{
                      height: 40,
                      width: 40,
                      backgroundColor: "black",
                      borderRadius: "8px",
                    }}
                    onClick={toggleActive}
                  ></div>
                }
                autofocusTarget="first-node"
                onClose={toggleActive}
              >
                <ColorPicker onChange={setColor} color={color} />
              </Popover>
              <TextField />
              </div>
            </div>
            <Divider />
            <Text as="h3">Spacing</Text>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField label="Inside top" suffix="px" />
              <TextField label="Inside bottom" suffix="px" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <TextField label="Outside top" suffix="px" />
              <TextField label="Outside bottom" suffix="px" />
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
            label="Date range"
            options={options}
            //   onChange={handleSelectChange}
            value={selected}
          />
          <Text variant="bodyMd" as="p">
            Theme fonts are not available in the preview mode. Publish item to
            preview it in store.
          </Text>
          <Text variant="bodyMd" as="p">
            Preorder message
          </Text>
          <div style={{ display: "flex", gap: 10 }}>
            <TextField suffix="px" />
            {/* <ColorPicker onChange={setColor} color={color} /> */}

            <Popover
              active={active}
              activator={
                <div
                  style={{
                    height: 40,
                    width: 40,
                    backgroundColor: "black",
                    borderRadius: "8px",
                  }}
                  onClick={toggleActive}
                ></div>
              }
              autofocusTarget="first-node"
              onClose={toggleActive}
            >
              <ColorPicker onChange={setColor} color={color} />
            </Popover>
            <TextField />
          </div>
        </BlockStack>
      </Card>
      {/* )} */}

      <Card>
        <Button fullWidth>Continue to products</Button>
      </Card>
    </div>
  );
}
