import { BrevoMailingService } from './brevo/brevo.js';
import {  SMTPMailingService } from '../configs/mailer.js';

/**
 * Factory class for creating mailing service instances based on environment configuration.
 */
class MailingServiceFactory {
  static createMailingService(apiKey, brevoMailingConfig, internalNotificationConfig) {
    console.log("Creating Mailing Service with:", apiKey, brevoMailingConfig, internalNotificationConfig);

    switch (process.env.MAIL_SERVICE) {
      
      case "Brevo":
        return new BrevoMailingService(apiKey, brevoMailingConfig);
      default:
        const smtpConfig = {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT, 10),
          secure: process.env.SMTP_SECURE === "true", // Convertit la chaîne en boolean
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        };

        return new SMTPMailingService(smtpConfig);
    }
  }
}

export { MailingServiceFactory };
