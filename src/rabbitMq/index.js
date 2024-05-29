/**
 * Configuration object for Subscribed Microservices Events (SMPevents).
 * This object maps each microservice's domain to the entities within that domain,
 * along with the CRUD operations each entity supports. This setup is used to
 * ensure that microservices subscribe only to valid and supported events,
 * enabling a robust, scalable, and error-resistant event-driven architecture.
 *
 * Structure:
 * Each key in the object represents a microservice domain, such as 'location' or 'userSpace'.
 * Each domain contains sub-keys that represent the entities within that domain.
 * Each entity is associated with an array of strings representing the CRUD operations
 * that the entity supports: 'created', 'updated', and 'deleted'.
 *
 * Usage:
 * This configuration is used by a validation function within the RabbitMQ service setup
 * to check if microservices are subscribed to valid events. The validation function
 * ensures that all active subscriptions in `muConsumers` match against the events listed
 * in `SMPevents`.
 *
 * Example:
 * If a microservice subscribes to listen for 'created' and 'deleted' events on 'User'
 * within the 'userSpace' domain, the validation function will confirm this subscription
 * by referencing the `SMPevents` configuration.
 *
 * @type {Object}
 */

const SMPevents = {
  location: {
    Place: ['created', 'updated', 'deleted'],
  },
  userSpace: {
    Profile: ['created', 'updated', 'deleted'],
    UserRole: ['created', 'updated', 'deleted'],
    PaymentMethod: ['created', 'updated', 'deleted'],
    PaymentConfig: ['created', 'updated', 'deleted'],
    Role: ['created', 'updated', 'deleted'],
    User: ['created', 'updated', 'deleted'],
    UserPreference: ['created', 'updated', 'deleted']
  },
  organization: {
    Organization: ['created', 'updated', 'deleted'],
    UserOrganization: ['created', 'updated', 'deleted'],
    TermsAndConditions: ['created', 'updated', 'deleted'],
    FaqOrganization: ['created', 'updated', 'deleted'],
    OrganizationMedia: ['created', 'updated', 'deleted'],
    Industry: ['created', 'updated', 'deleted'],
    TagOrganization: ['created', 'updated', 'deleted'],
    TopicOrganization: ['created', 'updated', 'deleted']
  },
  catalog: {
    Service: ['created', 'updated', 'deleted'],
    Criteria: ['created', 'updated', 'deleted'],
    Asset: ['created', 'updated', 'deleted'],
    ServiceAsset: ['created', 'updated', 'deleted'],
    ServiceMedia: ['created', 'updated', 'deleted'],
    FaqAnswer: ['created', 'updated', 'deleted'],
    FaqQuestion: ['created', 'updated', 'deleted'],
    FaqService: ['created', 'updated', 'deleted'],
    ServiceAttribute: ['created', 'updated', 'deleted'],
    Topic: ['created', 'updated', 'deleted'],
    Tag: ['created', 'updated', 'deleted']
  },
  accounting: {
    Invoice: ['created', 'updated', 'deleted'],
    Estimate: ['created', 'updated', 'deleted'],
    Transaction: ['created', 'updated', 'deleted'],
    EstimateAsset: ['created', 'updated', 'deleted']
  },
  notification: {
    Notification: ['created', 'updated', 'deleted'],
    NotificationTemplate: ['created', 'updated', 'deleted']
  },
  reviewComment: {
    Comment: ['created', 'updated', 'deleted'],
    Review: ['created', 'updated', 'deleted']

  },
  authentication: {
    Application: ['created', 'updated', 'deleted'],
    ApplicationToken: ['created', 'updated', 'deleted'],
    UserToken: ['created', 'updated', 'deleted']
  },
  document: {
    media: ['created', 'updated', 'deleted'],
    
  },
  upload: {
    Application: ['created'],
    
  }
};
export { SMPevents };