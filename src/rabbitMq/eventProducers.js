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
    User: generateCrudOperations('UserSpace.User', { deactivated: 'User.deactivated' }),
    UserRole: generateCrudOperations('UserSpace.UserRole', { dismissed: 'UserRole.dismissed' }),
    Profile: generateCrudOperations('UserSpace.Profile'),
    PaymentMethod: generateCrudOperations('UserSpace.PaymentMethod'),
    PaymentConfig: generateCrudOperations('UserSpace.PaymentConfig'),
    Role: generateCrudOperations('UserSpace.Role'),
    UserPreference: generateCrudOperations('UserSpace.UserPreference'),
  },

  Organization: {
    Organization: generateCrudOperations('Organization.Organization'),
    UserOrganization: generateCrudOperations('Organization.UserOrganization'),
    TermsAndConditions: generateCrudOperations('Organization.TermsAndConditions'),
    FaqOrganization: generateCrudOperations('Organization.FaqOrganization'),
    OrganizationMedia: generateCrudOperations('Organization.OrganizationMedia'),
    Industry: generateCrudOperations('Organization.Industry'),
    TagOrganization: generateCrudOperations('Organization.TagOrganization'),
    TopicOrganization: generateCrudOperations('Organization.TopicOrganization'),
    JointOrganizationInvitation: { sent: 'Organization.JointOrganizationInvitation.sent' },
    MemberOrganization: { invited: 'Organization.MemberOrganization.invited', removed: 'Organization.MemberOrganization.removed', updated: 'Organization.MemberOrganization.updated' },

  },

  Catalog: {
    Service: generateCrudOperations('Catalog.Service' , {addedToFavorite: 'Catalog.Service.addedToFavorite'}, {removedFromFavorite: 'Catalog.Service.removedFromFavorite'}),
    Criteria: generateCrudOperations('Catalog.Criteria'),
    Asset: generateCrudOperations('Catalog.Asset'),
    ServiceAsset: generateCrudOperations('Catalog.ServiceAsset'),
    ServiceMedia: generateCrudOperations('Catalog.ServiceMedia'),
    FaqAnswer: generateCrudOperations('Catalog.FaqAnswer'),
    FaqQuestion: generateCrudOperations('Catalog.FaqQuestion'),
    FaqService: generateCrudOperations('Catalog.FaqService'),
    ServiceAttribute: generateCrudOperations('Catalog.ServiceAttribute'),
    Topic: generateCrudOperations('Catalog.Topic'),
    Tag: generateCrudOperations('Catalog.Tag'),

  },

  Accounting: {
    Invoice: generateCrudOperations('Accounting.Invoice', { paid: 'Accounting.Invoice.paid' }, { paymentFailed: 'Accounting.Invoice.paymentFailed' }),
    Estimate: generateCrudOperations('Accounting.Estimate'),
    Transaction: generateCrudOperations('Accounting.Transaction'),
    EstimateAsset: generateCrudOperations('Accounting.EstimateAsset'),
    InvoicePaymentIntent:{ created: 'Accounting.InvoicePaymentIntent.created' },
  },

  Notification: {
    Notification: generateCrudOperations('Notification.Notification', { read: 'Notification.Notification.read' }),
    NotificationTemplate: generateCrudOperations('Notification.NotificationTemplate'),
    NotiUser: { created: 'Notification.NotiUser.created' },
    NotiCommit: { created: 'Notification.NotiCommit.created' },
    NewsletterContact: generateCrudOperations('Notification.NewsletterContact'),
    ContactGroup: generateCrudOperations('Notification.ContactGroup'),
    ContactGroupMembership: generateCrudOperations('Notification.ContactGroupMembership'),
    Campaign: generateCrudOperations('Notification.Campaign', { readyToCommit: 'Notification.Campaign.readyToCommit' }),
    Newsletter: generateCrudOperations('Notification.Newsletter', { readyToCommit: 'Notification.Newsletter.readyToCommit' }),
  },

  ReviewComment: {
    Criteria: generateCrudOperations('ReviewComment.Criteria'),
    Comment: generateCrudOperations('ReviewComment.Comment'),
    Review: generateCrudOperations('ReviewComment.Review'),
  },

  Authentication: {
    Application: generateCrudOperations('Authentication.Application', {logged: 'Authentication.Application.logged', register: 'Authentication.Application.register', desactivated: 'Authentication.Application.desactivated', logout: 'Authentication.Application.logout'}),
    ApplicationToken: generateCrudOperations('Authentication.ApplicationToken', {refreshed: 'Authentication.ApplicationToken.refreshed'}),
    UserToken: generateCrudOperations('Authentication.UserToken', {refreshed: 'Authentication.UserToken.refreshed'}),
    User: generateCrudOperations('Authentication.User', { deactivated: 'Authentication.User.deactivated', logged: 'Authentication.User.logged', signup: 'Authentication.User.signup', logout: 'Authentication.User.logout' }),
    AuthZ: { allowed: 'AuthZ.allowed', denied: 'AuthZ.denied', removed: 'AuthZ.removed', added: 'AuthZ.added' },
    ResetPasswordToken: generateCrudOperations('Authentication.ResetPasswordToken'),
    Password: generateCrudOperations('Authentication.Password'),
    UserInvited: {created: 'Authentication.UserInvited.created'},
  },

  Authorization: {
    Role: generateCrudOperations('Authorization.Role', { deactivated: 'Authorization.Role.revoked' }),
    Member: { logged: 'Authorization.Member.allowed', refreshed: 'Authorization.Member.denied', logout: 'Authorization.Member.removed', logout: 'Authorization.Member.added' },
  },

  Document: {
    Media: generateCrudOperations('Document.Media'),
  },

  Location: {
    Place: generateCrudOperations('Location.Place'),
  },
};

Object.freeze(SMPEvents);

export { SMPEvents, ACTIONS };
