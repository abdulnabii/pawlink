import { NotificationPayload, NotificationProvider, NotificationSendResult } from "../types";

export class EmailProvider implements NotificationProvider {
  channel = "EMAIL" as const;

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const provider = process.env.EMAIL_PROVIDER || "mock";
    const recipient = payload.recipientEmail;

    if (!recipient) {
      return {
        success: false,
        channel: "EMAIL",
        error: "Missing recipient email address",
      };
    }

    if (provider === "mock") {
      console.log(`[Email Provider Mock] -> Sent to ${recipient}: ${payload.title} - ${payload.body}`);
      return {
        success: true,
        channel: "EMAIL",
        providerId: `email.mock.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`,
      };
    }

    if (provider === "resend") {
      const apiKey = process.env.EMAIL_API_KEY;
      const from = process.env.EMAIL_FROM || "alerts@pawlink.pet";

      if (!apiKey) {
        return {
          success: false,
          channel: "EMAIL",
          error: "Resend API key missing in environment",
        };
      }

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: recipient,
            subject: `PawLink Alert: ${payload.title}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0f172a; margin-bottom: 8px;">🐾 PawLink Alert</h2>
                <h3 style="color: #ef4444; margin-top: 0;">${payload.title}</h3>
                <p style="font-size: 16px; color: #334155; line-height: 1.5;">${payload.body}</p>
                ${payload.approximateLocation ? `<p style="background: #f1f5f9; padding: 10px; border-radius: 6px;">📍 <strong>Location:</strong> ${payload.approximateLocation}</p>` : ""}
                <a href="${payload.dashboardUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">Open Recovery Dashboard</a>
              </div>
            `,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            channel: "EMAIL",
            error: data.message || "Resend email error",
          };
        }

        return {
          success: true,
          channel: "EMAIL",
          providerId: data.id,
        };
      } catch (err) {
        return {
          success: false,
          channel: "EMAIL",
          error: (err as Error).message,
        };
      }
    }

    return {
      success: true,
      channel: "EMAIL",
      providerId: `email.generic.${Date.now()}`,
    };
  }
}
