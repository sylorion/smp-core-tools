import nodemailer from "nodemailer";
import retry from "async-retry";
import  BrevoMailingService  from "../brevo/brevo.js"; // Assurez-vous que le chemin est correct.

/**
 * Abstract class representing a mailing service.
 */
class MailingService {
  /**
   * Send an email. Must be implemented by subclasses.
   * @param {string|string[]} to - The recipient(s) of the email.
   * @param {string} subject - The subject of the email.
   * @param {string} html - The HTML content of the email.
   * @param {object} options - Additional options for sending the email.
   * @throws {Error} Throws an error if the method is not implemented.
   */
  sendMail(to, subject, html, options) {
    throw new Error("Cette méthode doit être implémentée par la sous-classe");
  }
}


/**
 * Factory class for creating mailing service instances based on environment configuration.
 * Creates and returns an instance of a mailing service based on the MAIL_SERVICE environment variable.
 * @returns {MailingService} An instance of the appropriate subclass of MailingService.
 */

class MailingServiceFactory {
  static createMailingService(apiKey, brevoMailingConfig, internalNotificationConfig) {
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

/**
 * SMTP mailing service implementation.
 */
class SMTPMailingService extends MailingService {
  /**
   * Creates an instance of SMTPMailingService.
   *
   * @param {object} smtpConfig - The SMTP configuration object.
   */
  constructor(smtpConfig) {
    super();
    this.smtpConfig = smtpConfig;
  }

  /**
   * Sends an email using SMTP with retry logic.
   * Logique d'envoi d'email via SMTP
   * Utilisez le module nodemailer pour envoyer l'email
   * Utilisez la configuration SMTP fournie pour configurer le transporteur
   * Utilisez la méthode sendMail du transporteur pour envoyer l'email
   * @param {string|string[]} to - The recipient(s) of the email.
   * @param {string} subject - The subject of the email.
   * @param {string} html - The HTML content of the email.
   * @param {object} options - Additional options for sending the email.
   * @returns {Promise<void>} A promise that resolves when the email is sent successfully.
   */
  async sendMail(to, subject, html, options) {
    console.log("Envoi via SMTP", { to, subject });

    const mailOptions = {
      from: this.smtpConfig.auth.user,
      to: to,
      subject: subject,
      html: html,
      ...options,
    };

    await retry(
      async (bail) => {
        try {
          const transporter = nodemailer.createTransport(this.smtpConfig);
          // Create a new transporter for each attempt
          const info = await transporter.sendMail(mailOptions);

          console.log("Mail sent: %s", info.messageId);
        } catch (error) {
          if (error.responseCode === 550) {
            bail(
              new Error("Critical failure, stopping retry: " + error.message)
            ); // Stops retrying after a critical failure
          } else {
            console.error("Failed to send email via SMTP:", error);
            throw error; // This will trigger a retry unless max retries have been reached
          }
        }
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        onRetry: (error, attempt) =>
          console.log(`Tentative ${attempt}: ${error}`),
      }
    );
  }
}

export { MailingServiceFactory, MailingService };
