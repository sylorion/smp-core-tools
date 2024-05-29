import { generatePayloadForUser } from '../brevo/playloadBuilder.js';
import {modelNotification } from 'smp-core-schema';

/**
 * Gestionnaire d'événements pour envoyer des notifications.
 * @param {string} eventName - Nom de l'événement déclencheur.
 * @param {Object} userData - Données de l'utilisateur.
 * @param {Object} mailingService - Instance du service de mailing.
 * @param {Object} brevoTemplateConfig - Configuration des templates de Brevo.
 * @param {Object} internalNotificationConfig - Configuration des notifications internes.
 * @returns {Promise<void>} - Promesse résolue une fois les notifications envoyées.
 */
async function handleEvent(eventName, userData, mailingService, brevoTemplateConfig, internalNotificationConfig) {
  if (!eventName || !userData || !userData.email || !userData.id) {
    console.error('Invalid input data:', { eventName, userData });
    return;
  }

  const eventConfigurations = brevoTemplateConfig[eventName] || internalNotificationConfig[eventName];
  if (!eventConfigurations) {
    console.error('No notification configuration found for this event:', eventName);
    return;
  }

  for (let config of eventConfigurations) {
    try {
      if (config.type === 'mail') {
        const params = { greeting: `Hello ${userData.name}` }; // Exemple de paramètre spécifique
        const payload = generatePayloadForUser(userData, config.subject, config.templateId, params);
        await mailingService.sendMail(payload);
      }

      // Créer une notification en base de données
      await Notification.create({
        uniqRef: userData.email,
        slug: userData.slug,
        userID: userData.id,
        notificationTemplateID: config.templateId,
        notificationType: config.type,
        title: config.subject,
        message: config.type === 'mail' ? 'Email sent' : 'Action required'
      });
    } catch (error) {
      console.error('Error handling event:', eventName, error);
    }
  }
}

export { handleEvent };
