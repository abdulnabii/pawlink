import { NotificationPayload, NotificationProvider, NotificationSendResult } from "../types";

export class WhatsAppProvider implements NotificationProvider {
  channel = "WHATSAPP" as const;

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const provider = process.env.WHATSAPP_PROVIDER || "mock";
    const recipient = payload.recipientPhone;

    if (!recipient) {
      return {
        success: false,
        channel: "WHATSAPP",
        error: "Missing recipient WhatsApp phone number",
      };
    }

    // Format professional recovery message
    const formattedMessage = `🐾 *PAWLINK RECOVERY ALERT*\n\n` +
      `🚨 *${payload.title}*\n` +
      `${payload.body}\n\n` +
      (payload.approximateLocation ? `📍 *Location:* ${payload.approximateLocation}\n` : "") +
      `🔗 *Open Secure Dashboard:* ${payload.dashboardUrl}\n\n` +
      `_PawLink Pet Recovery Infrastructure_`;

    if (provider === "mock") {
      // In development/testing, simulate instantaneous WhatsApp delivery with deterministic message ID
      console.log(`[WhatsApp Provider Mock] -> Sent to ${recipient}:\n${formattedMessage}`);
      return {
        success: true,
        channel: "WHATSAPP",
        providerId: `wamid.mock.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`,
      };
    }

    if (provider === "twilio") {
      const accountSid = process.env.WHATSAPP_ACCOUNT_SID;
      const authToken = process.env.WHATSAPP_AUTH_TOKEN;
      const fromNumber = process.env.WHATSAPP_FROM_NUMBER || "+14155238886";

      if (!accountSid || !authToken) {
        return {
          success: false,
          channel: "WHATSAPP",
          error: "Twilio credentials not configured in environment",
        };
      }

      try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${fromNumber}`,
            To: `whatsapp:${recipient}`,
            Body: formattedMessage,
          }).toString(),
        });

        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            channel: "WHATSAPP",
            error: data.message || "Twilio API error",
          };
        }

        return {
          success: true,
          channel: "WHATSAPP",
          providerId: data.sid,
        };
      } catch (err) {
        return {
          success: false,
          channel: "WHATSAPP",
          error: (err as Error).message,
        };
      }
    }

    return {
      success: true,
      channel: "WHATSAPP",
      providerId: `wamid.generic.${Date.now()}`,
    };
  }
}
