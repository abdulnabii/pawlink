import { NotificationPayload, NotificationProvider, NotificationSendResult } from "../types";

function buildAdminOtpHtml(code: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 12px;">🐾</div>
      <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 22px; font-weight: 800;">Admin Security Code</h2>
      <p style="font-size: 14px; color: #64748b; margin: 0 0 24px;">Enter this 6-digit code to unlock the PawLink admin console:</p>
      <div style="background: #f8fafc; border: 2px dashed #0d9488; border-radius: 16px; padding: 20px; margin: 0 0 24px;">
        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #0f766e;">
          ${code}
        </span>
      </div>
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">Valid for 10 minutes. Do not share this code with anyone.</p>
    </div>
  `;
}

export class EmailProvider implements NotificationProvider {
  channel = "EMAIL" as const;

  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const apiKey = process.env.EMAIL_API_KEY;
    const isBrevoKey = Boolean(apiKey?.startsWith("xkeysib-") || process.env.BREVO_API_KEY);
    const activeProvider = process.env.EMAIL_PROVIDER || (isBrevoKey ? "brevo" : (apiKey ? "resend" : "mock"));
    const recipient = payload.recipientEmail;

    if (!recipient) {
      return {
        success: false,
        channel: "EMAIL",
        error: "Missing recipient email address",
      };
    }

    // 0. SMTP via nodemailer (Brevo SMTP — no IP restriction, most reliable)
    const smtpHost = process.env.BREVO_SMTP_HOST;
    const smtpUser = process.env.BREVO_SMTP_USER;
    const smtpPass = process.env.BREVO_SMTP_PASS;
    const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || "587", 10);
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "abdulnabi.khaskhely@gmail.com";

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: false,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const extractedCode = payload.body.match(/\b\d{6}\b/)?.[0];
        const htmlContent = payload.type === "ADMIN_2FA_ALERT" && extractedCode
          ? buildAdminOtpHtml(extractedCode)
          : `<div style="font-family: sans-serif; padding: 24px;"><h3>${payload.title}</h3><p>${payload.body}</p></div>`;

        const subject = payload.type === "ADMIN_2FA_ALERT" && extractedCode
          ? `Your PawLink Admin Code: ${extractedCode}`
          : `PawLink: ${payload.title}`;

        const info = await transporter.sendMail({
          from: `"PawLink Security" <${senderEmail}>`,
          to: recipient,
          subject,
          html: htmlContent,
        });

        console.log(`[SMTP Success] Email delivered to ${recipient}, messageId: ${info.messageId}`);
        return {
          success: true,
          channel: "EMAIL",
          deliveredRealEmail: true,
          deliveredTo: recipient,
          providerId: info.messageId,
        };
      } catch (err: any) {
        console.error(`[SMTP Error] Failed to send via Brevo SMTP:`, err?.message);
        // Fall through to next provider
      }
    }

    if (activeProvider === "mock" && !apiKey && !process.env.BREVO_API_KEY) {
      console.log(`[Email Provider Mock] -> Sent to ${recipient}: ${payload.title} - ${payload.body}`);
      return {
        success: true,
        channel: "EMAIL",
        deliveredRealEmail: false,
        providerId: `email.mock.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`,
      };
    }

    // 1. Brevo REST API Integration
    if (activeProvider === "brevo" || isBrevoKey) {
      const brevoKey = process.env.BREVO_API_KEY || apiKey;
      if (!brevoKey) {
        return {
          success: false,
          channel: "EMAIL",
          deliveredRealEmail: false,
          error: "Brevo API key missing in environment",
        };
      }

      try {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || "abdulnabi.khaskhely@gmail.com";
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoKey,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "PawLink Security", email: senderEmail },
            to: [{ email: recipient }],
            subject: payload.type === "ADMIN_2FA_ALERT"
              ? `Your PawLink Admin Security Code: ${payload.body.match(/\b\d{6}\b/)?.[0] || ""}`
              : `PawLink Alert: ${payload.title}`,
            htmlContent: payload.type === "ADMIN_2FA_ALERT"
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
                </div>
              `,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.warn(`[Brevo Error] Failed to send email to ${recipient}:`, data);
          return {
            success: false,
            channel: "EMAIL",
            deliveredRealEmail: false,
            error: data.message || "Brevo email error",
          };
        }

        console.log(`[Brevo Success] Email delivered to ${recipient}, id: ${data.messageId}`);
        return {
          success: true,
          channel: "EMAIL",
          deliveredRealEmail: true,
          deliveredTo: recipient,
          providerId: data.messageId,
        };
      } catch (err: any) {
        console.error(`[Brevo Network Error]:`, err);
        return {
          success: false,
          channel: "EMAIL",
          deliveredRealEmail: false,
          error: err.message,
        };
      }
    }

    // 2. Resend REST API Integration
    if (activeProvider === "resend" || apiKey) {
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
        let targetRecipient = recipient;
        let res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: targetRecipient,
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
          deliveredTo: recipient,
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
