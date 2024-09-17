/**
 * Valid action types for CRUD operations.
 * @constant {Object}
 */
const ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  VISITED: 'visited',  
  LISTED: 'listed',
};

Object.freeze(ACTIONS);

/**
 * Génère les opérations CRUD pour une entité donnée et permet l'ajout d'événements personnalisés.
 * @param {string} name - Le nom de l'entité (e.g., 'User', 'Profile').
 * @param {Object} [customEvents={}] - Un objet représentant les événements personnalisés.
 * @returns {Object} - Objet contenant les actions CRUD et les événements personnalisés.
 */
function generateCrudOperations(name, customEvents = {}) {
  const defaultEvents = {
    created: `${name}.${ACTIONS.CREATED}`,
    updated: `${name}.${ACTIONS.UPDATED}`,
    deleted: `${name}.${ACTIONS.DELETED}`,
    visited: `${name}.${ACTIONS.VISITED}`,
    listed: `${name}.${ACTIONS.LISTED}`,
  };

  // Combiner les événements standards avec les événements personnalisés
  return {
    ...defaultEvents,
    ...customEvents
  };
}

/**
 * Configuration des événements pour chaque entité des différents microservices,
 * accessible directement via `SMPEvents.User.visited` ou `SMPEvents.UserToken.resetToken`.
 */
const SMPEvents = {

  // [MU-USERSPACE]
  User: {
    ...generateCrudOperations('User', { deactivated: 'User.deactivated' })  
  },
  Profile: {
    ...generateCrudOperations('Profile')
  },
  PaymentMethod: {
    ...generateCrudOperations('PaymentMethod')
  },
  PaymentConfig: {
    ...generateCrudOperations('PaymentConfig')
  },
  Role: {
    ...generateCrudOperations('Role')
  },
  UserPreference: {
    ...generateCrudOperations('UserPreference')
  },

  // [MU-ORGANIZATION]
  Organization: {
    ...generateCrudOperations('Organization')
  },
  UserOrganization: {
    ...generateCrudOperations('UserOrganization')
  },
  TermsAndConditions: {
    ...generateCrudOperations('TermsAndConditions')
  },
  FaqOrganization: {
    ...generateCrudOperations('FaqOrganization')
  },
  OrganizationMedia: {
    ...generateCrudOperations('OrganizationMedia')
  },
  Industry: {
    ...generateCrudOperations('Industry')
  },
  TagOrganization: {
    ...generateCrudOperations('TagOrganization')
  },
  TopicOrganization: {
    ...generateCrudOperations('TopicOrganization')
  },

  // [MU-CATALOG]
  Service: {
    ...generateCrudOperations('Service')
  },
  Criteria: {
    ...generateCrudOperations('Criteria')
  },
  Asset: {
    ...generateCrudOperations('Asset')
  },
  ServiceAsset: {
    ...generateCrudOperations('ServiceAsset')
  },
  ServiceMedia: {
    ...generateCrudOperations('ServiceMedia')
  },
  FaqAnswer: {
    ...generateCrudOperations('FaqAnswer')
  },
  FaqQuestion: {
    ...generateCrudOperations('FaqQuestion')
  },
  FaqService: {
    ...generateCrudOperations('FaqService')
  },
  ServiceAttribute: {
    ...generateCrudOperations('ServiceAttribute')
  },
  Topic: {
    ...generateCrudOperations('Topic')
  },
  Tag: {
    ...generateCrudOperations('Tag')
  },

  // [MU-ACCOUNTING]
  Invoice: {
    ...generateCrudOperations('Invoice')
  },
  Estimate: {
    ...generateCrudOperations('Estimate')
  },
  Transaction: {
    ...generateCrudOperations('Transaction')
  },
  EstimateAsset: {
    ...generateCrudOperations('EstimateAsset')
  },

  // [MU-NOTIFICATION]
  Notification: {
    ...generateCrudOperations('Notification')
  },
  NotificationTemplate: {
    ...generateCrudOperations('NotificationTemplate')
  },

  // [MU-REVIEWCOMMENT]
  Comment: {
    ...generateCrudOperations('Comment')
  },
  Review: {
    ...generateCrudOperations('Review')
  },

  // [MU-AUTHENTICATION]
  Application: {
    ...generateCrudOperations('Application')
  },
  ApplicationToken: {
    ...generateCrudOperations('ApplicationToken') 
  },
  UserToken: {
    ...generateCrudOperations('UserToken')  
  },
  ResetPasswordToken: {
    ...generateCrudOperations('ResetPasswordToken')  
  },

  // [MU-DOCUMENT]
  Media: {
    ...generateCrudOperations('Media')
  },
};

Object.freeze(SMPEvents);

export { SMPEvents, ACTIONS };
