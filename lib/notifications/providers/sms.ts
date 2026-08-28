import { NotificationPayload, NotificationProvider, NotificationSendResult } from "../types";

export class SmsProvider implements NotificationProvider {
  channel = "SMS" as const;

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    console.log(`[SMS Provider Mock] -> Sent to ${payload.recipientPhone}: ${payload.title} - ${payload.body}`);
    return {
      success: true,
      channel: "SMS",
      providerId: `sms.mock.${Date.now()}`,
    };
  }
}

export class PushProvider implements NotificationProvider {
  channel = "PUSH" as const;

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    console.log(`[Push Provider Mock] -> Sent to user ${payload.userId}: ${payload.title}`);
    return {
      success: true,
      channel: "PUSH",
      providerId: `push.mock.${Date.now()}`,
    };
  }
}
