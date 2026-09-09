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

    if (provider === "mock" && !process.env.EMAIL_API_KEY) {
      console.log(`[Email Provider Mock] -> Sent to ${recipient}: ${payload.title} - ${payload.body}`);
      return {
        success: true,
        channel: "EMAIL",
        deliveredRealEmail: false,
        providerId: `email.mock.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`,
      };
    }

    // If Resend API key is provided (or provider === "resend"), attempt real delivery
    if (provider === "resend" || process.env.EMAIL_API_KEY) {
      const apiKey = process.env.EMAIL_API_KEY;
      // Resend allows "onboarding@resend.dev" for instant testing without domain verification
      const from = process.env.EMAIL_FROM || "PawLink Security <onboarding@resend.dev>";

      if (!apiKey) {
        return {
          success: false,
          channel: "EMAIL",
          deliveredRealEmail: false,
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
            subject: payload.type === "ADMIN_2FA_ALERT"
              ? `Your PawLink Admin Security Code: ${payload.body.match(/\b\d{6}\b/)?.[0] || ""}`
              : `PawLink Alert: ${payload.title}`,
            html: payload.type === "ADMIN_2FA_ALERT"
              ? `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; text-align: center;">
                  <div style="width: 52px; height: 52px; border-radius: 14px; background: #f0fdfa; border: 1px solid #99f6e4; color: #0d9488; font-size: 26px; line-height: 52px; margin: 0 auto 16px;">🐾</div>
                  <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 22px; font-weight: 800;">Admin 2FA Security Code</h2>
                  <p style="font-size: 14px; color: #64748b; margin: 0 0 24px;">Enter the following 6-digit one-time code to authenticate your administrative session:</p>
                  <div style="background: #f8fafc; border: 2px dashed #0d9488; border-radius: 16px; padding: 20px; margin: 0 0 24px;">
                    <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0f766e;">
                      ${payload.body.match(/\b\d{6}\b/)?.[0] || payload.body}
                    </span>
                  </div>
                  <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                    Code is valid for 10 minutes. If you did not request this login code, please secure your account.
                  </p>
                </div>
              `
              : `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; max-width: 580px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <h2 style="color: #0d9488; margin: 0; font-size: 20px;">🐾 PawLink Security</h2>
                  </div>
                  <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">${payload.title}</h3>
                  <p style="font-size: 15px; color: #334155; line-height: 1.6;">${payload.body}</p>
                  ${payload.approximateLocation ? `<p style="background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 13px;">📍 <strong>Location:</strong> ${payload.approximateLocation}</p>` : ""}
                  ${payload.dashboardUrl ? `<a href="${payload.dashboardUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 16px; font-size: 14px;">Open Recovery Dashboard</a>` : ""}
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated security notification from PawLink.</p>
                </div>
              `,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.warn(`[Resend Error] Failed to send email to ${recipient}:`, data);
          return {
            success: false,
            channel: "EMAIL",
            deliveredRealEmail: false,
            error: data.message || "Resend email error",
          };
        }

        console.log(`[Resend Success] Email delivered to ${recipient}, id: ${data.id}`);
        return {
          success: true,
          channel: "EMAIL",
          deliveredRealEmail: true,
          providerId: data.id,
        };
      } catch (err) {
        console.error(`[Resend Network Error]:`, err);
        return {
          success: false,
          channel: "EMAIL",
          deliveredRealEmail: false,
          error: (err as Error).message,
        };
      }
    }

    return {
      success: true,
      channel: "EMAIL",
      deliveredRealEmail: false,
      providerId: `email.generic.${Date.now()}`,
    };
  }
}
