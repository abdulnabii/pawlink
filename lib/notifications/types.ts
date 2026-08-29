export type NotificationChannel = "WHATSAPP" | "EMAIL" | "SMS" | "PUSH" | "IN_APP";

export interface NotificationPayload {
  userId: string;
  petId?: string;
  petName?: string;
  type:
    | "SCAN_ALERT"
    | "LOCATION_ALERT"
    | "MESSAGE_ALERT"
    | "LOST_MODE_ACTIVATED"
    | "PET_RECOVERED"
    | "TEST_ALERT"
    | "PLAN_UPGRADED"
    | "PLAN_PAYMENT_REJECTED"
    | "PAYMENT_VERIFICATION_REQUESTED";
  title: string;
  body: string;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  tagCode?: string;
  approximateLocation?: string | null;
  dashboardUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationSendResult {
  success: boolean;
  channel: NotificationChannel;
  providerId?: string;
  error?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<NotificationSendResult>;
}
