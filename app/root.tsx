import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react";
import polarisTranslations from "./polarisTranslations.server";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import { AppBridgeProvider } from "./components/AppBridgeProvider";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ polarisTranslations });
}

export default function App() {
  const { polarisTranslations } = useLoaderData<typeof loader>();
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <meta name="shopify-api-key" content="409fb8e80f3145241daeff0fccc04a8c" />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <Meta />
        <Links />
      </head>
      <body>
        <AppBridgeProvider>
          <PolarisAppProvider i18n={polarisTranslations}>
            <Outlet />
          </PolarisAppProvider>
        </AppBridgeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}