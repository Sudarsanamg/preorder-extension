import { THEME_LIST } from "app/graphql/queries/campaign";

export const checkAppEmbedEnabled = async (admin: any) => {
  try {
    const response = await admin.graphql(THEME_LIST, {
      variables: {
        roles: ["MAIN"],
        filenames: ["config/settings_data.json"],
      },
    });

    const data = await response.json();

    const fileNode =
      data?.data?.themes?.edges?.[0]?.node?.files?.nodes?.[0];
    if (!fileNode) throw new Error("settings_data.json not found");

    let raw = "";
    const body = fileNode.body;

    if (body?.contentBase64) {
      raw = Buffer.from(body.contentBase64, "base64").toString("utf-8");
    } else if (body?.content) {
      raw = body.content;
    } else if (body?.url) {
      const res = await fetch(body.url);
      raw = await res.text();
    } else {
      throw new Error("No content found in theme file");
    }

    // Clean up comment header
    const cleaned = raw
      .replace(/^\uFEFF/, "")
      .replace(/\/\*[\s\S]*?\*\//gm, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ Invalid JSON:", err);
      console.error("⚠️ Raw snippet start:\n", cleaned.slice(0, 500));
      throw new Error("Invalid JSON in settings_data.json: Check your theme file syntax.");
    }

    // 🔍 1️⃣ Check for App Embeds
    const embeds =
      parsed?.current?.enabled_embeds ||
      parsed?.enabled_embeds ||
      [];
    const embedEnabled = Array.isArray(embeds)
      ? embeds.some((embed: string) => embed.includes("preorder-extension"))
      : false;

    // 🔍 2️⃣ Check for App Blocks (like yours)
    const blocks = parsed?.current?.blocks || {};
    const blockEnabled = Object.values(blocks).some(
      (b: any) =>
        typeof b === "object" &&
        b.type?.includes("preorder-extension") &&
        b.disabled === false
    );

    const appEnabled = embedEnabled || blockEnabled;

    // console.log("✅ App Embed/Block Enabled:", appEnabled);
    return appEnabled;
  } catch (error) {
    console.error("An error occurred in checkAppEmbedEnabled:", error);
    throw error;
  }
};
