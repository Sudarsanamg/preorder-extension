import { useState, useEffect } from "react";
import { Banner, Button, ButtonGroup, Text } from "@shopify/polaris";

interface AppEmbedBannerProps {
  shop: string;
  isAppEmbedEnabled: boolean;
  handleRefresh: () => void;
  isRefreshing: boolean;
}

export function AppEmbedBanner({
  shop,
  isAppEmbedEnabled,
  handleRefresh,
  isRefreshing,
}: AppEmbedBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    if ( loader) {
      setTimeout(() => {
        setLoader(false);
      },5000)
    }
  }, [isAppEmbedEnabled,loader]);

  if (dismissed) return null;

  const handleActivateNow = () => {
    window.open(
      `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=409fb8e80f3145241daeff0fccc04a8c/preorder-embed`,
      "_blank"
    );
  };

  const handleClickRefresh = async () => {
    setLoader(true);
    handleRefresh();
    
  };
  

  return (
    <div style={{ marginBottom: "1rem" ,margin:5 }}>
      <Banner
        title="App embed not enabled"
        tone="warning"
        onDismiss={() => setDismissed(true)}
      >
        <Text as="p">
          To activate the Preorder Extension on your storefront, enable the app
          embed in your theme editor.
        </Text>

        <div style={{ marginTop: 10 }}></div>
        <ButtonGroup>
          <Button variant="primary" onClick={handleActivateNow}>
            Activate now
          </Button>
          <Button loading={loader} onClick={handleClickRefresh}>
            Refresh
          </Button>
        </ButtonGroup>
      </Banner>
    </div>
  );
}
