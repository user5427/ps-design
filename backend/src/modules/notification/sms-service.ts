import twilio from "twilio";
import type { FastifyInstance } from "fastify";

export interface SMSNotificationData {
  phoneNumber: string;
  message: string;
}

export class SMSService {
  private client: twilio.Twilio;
  private enabled: boolean;
  private fromNumber: string;

  constructor(
    accountSid: string,
    authToken: string,
    fromNumber: string,
    enabled: boolean = true,
  ) {
    this.client = twilio(accountSid, authToken);
    this.enabled = enabled;
    this.fromNumber = fromNumber;
  }

  /**
   * Send an SMS message using Twilio
   */
  async sendSMS(data: SMSNotificationData): Promise<void> {
    if (!this.enabled) {
      console.log("📱 SMS notifications are disabled");
      return;
    }

    if (!data.phoneNumber) {
      console.log("📱 No phone number provided, skipping SMS notification");
      return;
    }

    // Validate phone number format (E.164 format required)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      console.warn(
        `📱 Invalid phone number format: ${data.phoneNumber}. Use E.164 format (e.g., +14155552671)`,
      );
      return;
    }

    try {
      const message = await this.client.messages.create({
        body: data.message,
        from: this.fromNumber,
        to: data.phoneNumber,
      });

      console.log(`📱 SMS sent successfully to ${data.phoneNumber}`, {
        messageId: message.sid,
        status: message.status,
      });
    } catch (error: any) {
      // Provide helpful error messages for common issues
      if (error.code === 21211) {
        console.error(
          `📱 SMS Error: Invalid 'To' phone number: ${data.phoneNumber}`,
        );
        console.error(
          `   Make sure the number is in E.164 format with country code`,
        );
      } else if (error.code === 21608) {
        console.error(
          `📱 SMS Error: The number ${data.phoneNumber} is not verified for trial accounts`,
        );
        console.error(
          `   Visit: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`,
        );
      } else if (error.code === 21614) {
        console.error(
          `📱 SMS Error: Invalid 'From' number: ${this.fromNumber}`,
        );
        console.error(`   Check your Twilio phone number configuration`);
      } else {
        console.error(
          `📱 Failed to send SMS to ${data.phoneNumber}:`,
          error.message || error,
        );
      }
      // Don't throw - we don't want SMS failures to break the appointment creation
    }
  }

  /**
   * Send appointment confirmation SMS
   */
  async sendAppointmentConfirmation(
    customerName: string,
    customerPhone: string,
    serviceName: string,
    employeeName: string,
    startTime: Date,
    businessName: string,
  ): Promise<void> {
    const formattedDate = startTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = startTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = `Hi ${customerName}, your appointment for ${serviceName} with ${employeeName} at ${businessName} is confirmed for ${formattedDate} at ${formattedTime}. See you soon!`;

    await this.sendSMS({
      phoneNumber: customerPhone,
      message,
    });
  }
}

/**
 * Factory function to create SMS service from environment variables
 */
export function createSMSService(fastify: FastifyInstance): SMSService {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || "";
  const enabled = process.env.ENABLE_SMS_NOTIFICATIONS === "true";

  if (enabled && (!accountSid || !authToken || !fromNumber)) {
    fastify.log.warn(
      "📱 SMS notifications enabled but Twilio credentials are missing in environment variables",
    );
  }

  return new SMSService(accountSid, authToken, fromNumber, enabled);
}
