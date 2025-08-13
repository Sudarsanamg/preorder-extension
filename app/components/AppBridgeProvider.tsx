import { createContext, useContext, useEffect, useState } from "react";
import createApp from "@shopify/app-bridge";
import { Redirect } from "@shopify/app-bridge/actions";

interface AppBridgeContextType {
  appBridge: any | null;
}

export const AppBridgeContext = createContext<AppBridgeContextType | null>(null);

export function useAppBridge() {
  const context = useContext(AppBridgeContext);
  if (!context) {
    throw new Error("useAppBridge must be used within an AppBridgeProvider");
  }
  return context.appBridge;
}

export function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  const [appBridge, setAppBridge] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const apiKey = "409fb8e80f3145241daeff0fccc04a8c";
      const host = urlParams.get("host")!;

      if (apiKey && host) {
        // Initialize Shopify App Bridge
        const app = createApp({
          apiKey,
          host,
          forceRedirect: true,
        });

        setAppBridge(app);

        // Initialize the Redirect action
        const redirect = Redirect.create(app);

        // Redirect to Shopify Admin (the payload needs to be a URL or string here)
        const adminUrl = "https://prorderstore.myshopify.com/admin";
        redirect.dispatch(Redirect.Action.APP, adminUrl); // Provide a string URL for the redirect
      }
    }
  }, []);

  return (
    <AppBridgeContext.Provider value={{ appBridge }}>
      {children}
    </AppBridgeContext.Provider>
  );
}