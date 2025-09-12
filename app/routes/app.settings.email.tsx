import {
  BlockStack,
  Card,
  Page,
  Text,
  LegacyStack,
  RadioButton,
  InlineStack,
  TextField,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

export default function SettingsEmail() {
  const [value, setValue] = useState("main");

  const handleChange = useCallback(
    (_: boolean, newValue: string) => setValue(newValue),
    [],
  );

  const [fromName,setFromName] = useState("preorder");

  return (
    <Page
      title="Customize Sender Email"
      backAction={{ content: "Back", url: "/app/" }}
    >
      <Card >
        <BlockStack gap={"400"}>
          <Text variant="headingMd" as="h2">
            Sender email
          </Text>
          <Text variant="bodyMd" as="h2">
            All transactional preorder emails will be sent from this address.
          </Text>
          <Card>
            <RadioButton
              label="info@essentialspreorder.com"
              checked={value === "main"}
              id="main"
              name="main"
              onChange={handleChange}
            />
            {
                value === "main" && (
                    <InlineStack gap={"400"} align="space-around">
                        <TextField
                            type="text"
                            value="preorder"
                            
                            label="From name"
                            autoComplete="off"
                        />
                        <TextField
                            type="text"
                            value="info@essentialspreorder.com"
                            readOnly
                            label="From email"
                            autoComplete="off"
                            disabled
                        />
                        <TextField
                            type="text"                            
                            label="Reply-to name"
                            autoComplete="off"
                            placeholder="Reply-to name"
                        />
                    </InlineStack>
                )
            }
          </Card>
          <Card>
            <RadioButton
              label="Custom"
              checked={value === "custom"}
              id="custom"
              name="custom"
              onChange={handleChange}
            />

            {
                value === "custom" && (
                    <div style={{padding:5}}>
                    <Text variant="bodyMd" as="p">When you add your email, we generate DNS records for you to add to your domain provider in order to authenticate your domain and improve email deliverability. Learn how to setup.</Text>
                    <InlineStack gap={"400"} align="space-around" >
                        <TextField
                            type="text"
                            label="From name"
                            autoComplete="off"
                            value={fromName}
                            onChange={setFromName}
                        />
                        <TextField
                            type="text"
                            label="From email"
                            autoComplete="off"
                            placeholder="info@email.com"
                        />
                        <TextField
                            type="text"
                            label="Reply-to name"
                            autoComplete="off"
                            placeholder="Reply-to name"
                        />
                    </InlineStack>
                    </div>
                )
            }
          </Card>
        </BlockStack>
      </Card>
    </Page>
  );
}
