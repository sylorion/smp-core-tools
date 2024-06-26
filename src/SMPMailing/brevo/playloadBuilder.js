/**
 * Génère le payload pour l'envoi d'email via Brevo en fonction des données utilisateur et de la configuration de template.
 * @param {Object} user - L'utilisateur à notifier.
 * @param {string} subject - Sujet de l'email.
 * @param {number} templateId - ID du template Brevo à utiliser.
 * @param {Object} params - Paramètres spécifiques au template.
 * @returns {Object} Payload formaté pour l'API de Brevo.
 */
function generatePayloadForUser(user, subject, templateId, params) {
  return {
    sender: {
      email: "leonceyopa@gmail.com",
      name: "SERVICES",
    },
    to: [
      {
        email: user.email,
        name: user.name || user.username || 'User', // Utilise le nom, le nom d'utilisateur ou 'User' par défaut
      },
    ],
    subject: subject,
    templateId: templateId,
    params: {
      ...params,
      userName: user.name || user.username || 'User', // Ajoute le nom d'utilisateur aux paramètres
    },
  };
}

export { generatePayloadForUser };
