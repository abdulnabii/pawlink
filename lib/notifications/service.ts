import { db } from "../db";
import { NotificationPayload, NotificationSendResult } from "./types";
import { WhatsAppProvider } from "./providers/whatsapp";
import { EmailProvider } from "./providers/email";
import { SmsProvider, PushProvider } from "./providers/sms";

export class NotificationService {
  private whatsAppProvider = new WhatsAppProvider();
  private emailProvider = new EmailProvider();
  private smsProvider = new SmsProvider();
  private pushProvider = new PushProvider();

  /**
   * Dispatches a notification using the multi-tier fallback architecture:
   * 1. Primary: WhatsApp (if enabled, verified, and phone provided)
   * 2. Fallback: Email (if WhatsApp fails or is unconfigured, and email enabled)
   * 3. Always: Records an IN_APP notification in the database for the user's dashboard
   */
  async dispatch(payload: NotificationPayload): Promise<{
    primaryResult?: NotificationSendResult;
    fallbackResult?: NotificationSendResult;
    inAppCreated: boolean;
  }> {
    // 1. Fetch user's notification preferences
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: { notificationPreference: true },
    });

    if (!user) {
      throw new Error(`User with ID ${payload.userId} not found`);
    }

    const prefs = user.notificationPreference;
    const verifiedPhone = prefs?.whatsappVerified && (prefs.notificationPhone || user.phone);
    const recipientEmail = payload.recipientEmail || user.email;
    const recipientPhone = payload.recipientPhone || verifiedPhone;

    let primaryResult: NotificationSendResult | undefined;
    let fallbackResult: NotificationSendResult | undefined;

    // 2. Check Subscription Plan for WhatsApp alerts entitlement
    const sub = await db.subscription.findFirst({
      where: { userId: user.id },
    });
    const isPlanEntitledToWhatsApp = sub?.plan === "PLUS" || sub?.plan === "PRO";

    // Primary: Attempt WhatsApp if plan supports it, enabled and verified
    const shouldSendWhatsApp =
      isPlanEntitledToWhatsApp &&
      (prefs ? prefs.whatsappEnabled && prefs.whatsappVerified && Boolean(recipientPhone) : Boolean(recipientPhone));

    let effectiveChannel = "IN_APP";
    let effectiveStatus = "SENT";
    let providerId: string | undefined;
    let providerError: string | undefined;

    if (shouldSendWhatsApp && recipientPhone) {
      primaryResult = await this.whatsAppProvider.send({
        ...payload,
        recipientPhone,
      });
      if (primaryResult.success) {
        effectiveChannel = "WHATSAPP";
        providerId = primaryResult.providerId;
      } else {
        providerError = primaryResult.error;
      }
    }

    // 3. Fallback to Email if WhatsApp wasn't sent or failed
    const needsEmailFallback = !shouldSendWhatsApp || (primaryResult && !primaryResult.success);
    const shouldSendEmail = prefs ? prefs.emailEnabled : true;

    if (needsEmailFallback && shouldSendEmail && recipientEmail) {
      fallbackResult = await this.emailProvider.send({
        ...payload,
        recipientEmail,
      });
      if (fallbackResult.success && effectiveChannel === "IN_APP") {
        effectiveChannel = "EMAIL";
        providerId = fallbackResult.providerId;
      } else if (!fallbackResult.success && !providerError) {
        providerError = fallbackResult.error;
      }
    }

    // 4. Create single consolidated notification in database for user dashboard
    await db.notification.create({
      data: {
        userId: user.id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        channel: effectiveChannel,
        status: effectiveStatus,
        providerId,
        error: providerError,
        metadata: JSON.stringify({
          ...payload.metadata,
          approximateLocation: payload.approximateLocation,
          tagCode: payload.tagCode,
          recipientPhone,
          recipientEmail,
          isFallback: Boolean(primaryResult && !primaryResult.success),
        }),
      },
    });

    return {
      primaryResult,
      fallbackResult,
      inAppCreated: true,
    };
  }
}

export const notificationService = new NotificationService();
