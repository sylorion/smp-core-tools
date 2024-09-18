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
 * @param {string} entityName - Le nom de l'entité (e.g., 'User', 'Profile').
 * @param {Object} [customEvents={}] - Un objet représentant les événements personnalisés.
 * @returns {Object} - Objet contenant les actions CRUD et les événements personnalisés.
 */
function generateCrudOperations(entityName, customEvents = {}) {
  const defaultEvents = {
    created: `${entityName}.${ACTIONS.CREATED}`,
    updated: `${entityName}.${ACTIONS.UPDATED}`,
    deleted: `${entityName}.${ACTIONS.DELETED}`,
    visited: `${entityName}.${ACTIONS.VISITED}`,
    listed: `${entityName}.${ACTIONS.LISTED}`,
  };

  return {
    ...defaultEvents,
    ...customEvents,
  };
}

/**
 * Configuration des événements pour chaque entité des différents microservices,
 * accessible via des chemins comme `SMPEvents.UserSpace.User.created`.
 */
const SMPEvents = {
  UserSpace: {
    User: generateCrudOperations('User', { deactivated: 'User.deactivated' }),
    Profile: generateCrudOperations('Profile'),
    PaymentMethod: generateCrudOperations('PaymentMethod'),
    PaymentConfig: generateCrudOperations('PaymentConfig'),
    Role: generateCrudOperations('Role'),
    UserPreference: generateCrudOperations('UserPreference'),
  },

  Organization: {
    Organization: generateCrudOperations('Organization'),
    UserOrganization: generateCrudOperations('UserOrganization'),
    TermsAndConditions: generateCrudOperations('TermsAndConditions'),
    FaqOrganization: generateCrudOperations('FaqOrganization'),
    OrganizationMedia: generateCrudOperations('OrganizationMedia'),
    Industry: generateCrudOperations('Industry'),
    TagOrganization: generateCrudOperations('TagOrganization'),
    TopicOrganization: generateCrudOperations('TopicOrganization'),
  },

  Catalog: {
    Service: generateCrudOperations('Service'),
    Criteria: generateCrudOperations('Criteria'),
    Asset: generateCrudOperations('Asset'),
    ServiceAsset: generateCrudOperations('ServiceAsset'),
    ServiceMedia: generateCrudOperations('ServiceMedia'),
    FaqAnswer: generateCrudOperations('FaqAnswer'),
    FaqQuestion: generateCrudOperations('FaqQuestion'),
    FaqService: generateCrudOperations('FaqService'),
    ServiceAttribute: generateCrudOperations('ServiceAttribute'),
    Topic: generateCrudOperations('Topic'),
    Tag: generateCrudOperations('Tag'),
  },

  Accounting: {
    Invoice: generateCrudOperations('Invoice'),
    Estimate: generateCrudOperations('Estimate'),
    Transaction: generateCrudOperations('Transaction'),
    EstimateAsset: generateCrudOperations('EstimateAsset'),
  },

  Notification: {
    Notification: generateCrudOperations('Notification'),
    NotificationTemplate: generateCrudOperations('NotificationTemplate'),
  },

  ReviewComment: {
    Comment: generateCrudOperations('Comment'),
    Review: generateCrudOperations('Review'),
  },

  Authentication: {
    Application: generateCrudOperations('Application'),
    ApplicationToken: generateCrudOperations('ApplicationToken'),
    UserToken: generateCrudOperations('UserToken'),
    ResetPasswordToken: generateCrudOperations('ResetPasswordToken'),
  },

  Document: {
    Media: generateCrudOperations('Media'),
  },
};

Object.freeze(SMPEvents);

export { SMPEvents, ACTIONS };
