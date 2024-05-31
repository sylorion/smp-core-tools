import fetch from 'node-fetch';
import { MailingService } from 'smp-core-tools';
/**
 * Classe pour envoyer des emails en utilisant l'API Brevo.
 */
class BrevoMailingService extends MailingService{
  
  /**
   * Initialise une nouvelle instance de BrevoMailingService.
   * @param {string} apiKey - La clé API pour l'authentification des requêtes à l'API Brevo.
   * @param {Object} brevoMailingConfig - Configuration des templates de Brevo.
   */
  constructor(apiKey, brevoMailingConfig) {
    super(); // Appel du constructeur de la classe parente
    console.log('Calling BrevoMailingService constructor'); // Vérifiez que le constructeur est appelé

    this.apiKey = apiKey;
    this.brevoMailingConfig = brevoMailingConfig;
    console.log("OKBREVOLO", brevoMailingConfig)
    console.log('BrevoMailingService initialized with API key:', this.apiKey); // Ajoutez ce log pour vérifier la clé API
  }

  /**
   * Envoie un email en utilisant l'API Brevo.
   * @param {Object} payload - Le payload complet pour l'email, tel qu'attendu par l'API Brevo.
   * @returns {Promise<void>} - Une promesse qui est résolue lorsque l'email est envoyé avec succès.
   * @throws {Error} - Lève une erreur si l'envoi de l'email échoue.
   */
  async sendMail(payload) {
    console.log("OKBREVO11");


    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
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

export { BrevoMailingService };
