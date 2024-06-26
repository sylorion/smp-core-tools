import fetch from 'node-fetch';
import { MailingService } from '../../configs/mailer.js';

/**
 * Classe pour envoyer des emails en utilisant l'API Brevo.
 */
class BrevoMailingService extends MailingService {
  /**
   * Initialise une nouvelle instance de BrevoMailingService.
   * @param {string} apiKey - La clé API pour l'authentification des requêtes à l'API Brevo.
   * @param {Object} brevoMailingConfig - Configuration des templates de Brevo.
   */
  constructor(apiKey, brevoMailingConfig) {
    super(); // Appel du constructeur de la classe parente
    this.apiKey = apiKey;
    this.brevoMailingConfig = brevoMailingConfig;
  }

  /**
   * Envoie un email en utilisant l'API Brevo.
   * @param {Object} payload - Le payload complet pour l'email, tel qu'attendu par l'API Brevo.
   * @returns {Promise<void>} - Une promesse qui est résolue lorsque l'email est envoyé avec succès.
   * @throws {Error} - Lève une erreur si l'envoi de l'email échoue.
   */
  async sendMail(payload) {

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey // Utilisation de l'en-tête 'api-key' au lieu de 'Authorization'
        },
        body: JSON.stringify(payload)
      });

      const responseBody = await response.text();
      console.log('Response Body:', responseBody);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${responseBody}`);
      }

      const responseData = JSON.parse(responseBody);
      console.log("Email sent successfully!", responseData);
    } catch (error) {
      console.error("Failed to send email via Brevo API:", error);
      throw error;
    }
  }
}

export { BrevoMailingService };
