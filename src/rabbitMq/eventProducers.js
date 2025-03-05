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
    star: 'UserSpace.*',
    User: generateCrudOperations('UserSpace.User', { deactivated: 'User.deactivated', star: 'User.*'}),
    UserRole: generateCrudOperations('UserSpace.UserRole', { dismissed: 'UserRole.dismissed', star: 'UserRole.*'}),
    Profile: generateCrudOperations('UserSpace.Profile', { star: 'Profile.*'}),
    PaymentMethod: generateCrudOperations('UserSpace.PaymentMethod', { star: 'PaymentMethod.*'}),
    PaymentConfig: generateCrudOperations('UserSpace.PaymentConfig', { star: 'PaymentConfig.*'}),
    Role: generateCrudOperations('UserSpace.Role', { star: 'Role.*'}),
    UserPreference: generateCrudOperations('UserSpace.UserPreference', { star: 'UserPreference.*'}),
  },

  Organization: {
    star: 'Organization.*',
    Organization: generateCrudOperations('Organization.Organization', { star: 'Organization.*'}),
    UserOrganization: generateCrudOperations('Organization.UserOrganization', { star: 'UserOrganization.*'}),
    TermsAndConditions: generateCrudOperations('Organization.TermsAndConditions', { star: 'TermsAndConditions.*'}),
    FaqOrganization: generateCrudOperations('Organization.FaqOrganization', { star: 'FaqOrganization.*'}),
    OrganizationMedia: generateCrudOperations('Organization.OrganizationMedia', { star: 'OrganizationMedia.*'}),
    Industry: generateCrudOperations('Organization.Industry', { star: 'Industry.*'}),
    TagOrganization: generateCrudOperations('Organization.TagOrganization', { star: 'TagOrganization.*'}),
    TopicOrganization: generateCrudOperations('Organization.TopicOrganization', { star: 'TopicOrganization.*'}),
    JointOrganizationInvitation: { sent: 'Organization.JointOrganizationInvitation.sent', star: 'JointOrganizationInvitation.*' },
    MemberOrganization: { invited: 'Organization.MemberOrganization.invited', removed: 'Organization.MemberOrganization.removed', updated: 'Organization.MemberOrganization.updated', star: 'MemberOrganization.*' },
  },

  Catalog: {
    Service: generateCrudOperations('Catalog.Service'),
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
