
import {CREATE_WEBHOOK} from '../graphql/mutation/webhook'

export async function createWebhook(admin: any, topic: string, callbackUrl: string) {
  const res = await admin.graphql(CREATE_WEBHOOK, {
    variables: {
      topic,
      webhookSubscription: { callbackUrl, format: "JSON" },
    },
  });
  return res.json();
}
