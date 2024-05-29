import {MailingService} from '../configs/mailer.js';
import fetch from 'node-fetch';

class BrevoMailingService extends MailingService {
  /**
   * Initialise une nouvelle instance de BrevoMailingService.
   * @param {string} apiKey - La clé API pour l'authentification des requêtes à l'API Brevo.
   * @param {Object} brevoMailingConfig - Configuration des templates de Brevo.
   */
  constructor(apiKey, brevoMailingConfig) {
    super();
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
      const response = await fetch('https://api.brevo.com/v3/smtp/email', { // Assurez-vous que l'URL est correcte
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Email sent successfully!", responseData);
    } catch (error) {
      console.error("Failed to send email via Brevo API:", error);
      throw error;
    }
  }
}

export default BrevoMailingService;
