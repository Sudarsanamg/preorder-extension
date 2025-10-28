import { useState } from "react";
import { Banner, Button, ButtonGroup, Text } from "@shopify/polaris";

interface AppEmbedBannerProps {
  shop: string;
}

export function AppEmbedBanner({ shop }: AppEmbedBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleActivateNow = () => {
    // Redirect merchant to Theme Editor App Embed section
    // Replace your extension ID below 👇
    window.open(
      `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=preorder-extension`,
      "_blank",
    );
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <Banner
        title="App embed not enabled"
        tone="warning"
        onDismiss={() => setDismissed(true)}
      >
        <Text as="p">
          To activate the Preorder Extension on your storefront, enable the app
          embed in your theme editor.
        </Text>

        <ButtonGroup>
          <Button variant="primary" onClick={handleActivateNow}>
            Activate now
          </Button>
          <Button onClick={() => setDismissed(true)}>Already done it</Button>
        </ButtonGroup>
      </Banner>
    </div>
  );
}
