import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate,  } from "@remix-run/react";
import createApp from "@shopify/app-bridge";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const apiKey = "409fb8e80f3145241daeff0fccc04a8c";
      const host = urlParams.get("host");

      // Only proceed if we have both apiKey and host
      if (apiKey && host) {
        try {
          // Initialize Shopify App Bridge
          const app = createApp({
            apiKey,
            host,
            forceRedirect: true,
          });

          setAppBridge(app);

          // Simple navigation integration
          // Store the navigate function on the app for use elsewhere
          (app as any).navigate = (path: string) => {
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            navigate(cleanPath);
          };

          console.log('App Bridge initialized successfully');

        } catch (error) {
          console.error('Error initializing App Bridge:', error);
        }
      } else {
        console.warn('Missing API key or host parameter for App Bridge');
      }
    }
  }, []); 

  return (
    <AppBridgeContext.Provider value={{ appBridge }}>
      {children}
    </AppBridgeContext.Provider>
  );
}