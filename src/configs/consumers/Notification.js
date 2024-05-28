/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on entities within the microservices.
 *
 * The 'notification' key represents the exchange name in RabbitMQ under which the events will be published.
 * It maps actions to specific callback functions for entities managed by the 'UserSpace', 'Accounting', and 'services' microservices.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { Notification } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [microservice, entities] of Object.entries(Notification)) {
 *   for (const [entity, actions] of Object.entries(entities)) {
 *     for (const [action, callbackName] of Object.entries(actions)) {
 *       // Setup consumer for each action
 *       setupConsumer(microservice, entity, action, callbackName);
 *     }
 *   }
 * }
 *
 * @property {Object} userSpace - Manages events related to 'user', 'user_role', 'payment_method', and 'payment_config' entities.
 * @property {Object} accounting - Manages events related to 'estimate', 'invoice', and 'transaction' entities.
 * @property {Object} services - Manages events related to 'documentation', 'service', 'service_media', and 'service_asset' entities.
 */

 
const Notification = {
  userSpace: {
    user: {
      created: ["pushNewUserNotification", "mailNewUserNotification"],
      updated: "pushUpdateUserNotification",
      deleted: "mailDeleteUserNotification",
    },
    user_role: {
      created: "pushNewUserRoleNotification, mailNewUserRoleNotification",
      updated: "pushUpdateUserRoleNotification, mailUpdateUserRoleNotification",
      deleted: "pushDeleteUserRoleNotification, mailDeleteUserRoleNotification",
    },
    payment_method: {
      created:
        "pushNewPaymentMethodNotification, mailNewPaymentMethodNotification",
      updated:
        "pushUpdatePaymentMethodNotification",
      deleted:
        "pushDeletePaymentMethodNotification, mailDeletePaymentMethodNotification",
    },
    payment_config: {
      created:
        "pushNewPaymentConfigNotification, mailNewPaymentConfigNotification",
      updated:
        "pushUpdatePaymentConfigNotification",
      deleted:
        "pushDeletePaymentConfigNotification",
    },
  },
  accounting: {
    estimate: {
      created: "pushNewEstimateNotification, mailNewEstimateNotification",
      updated: "pushUpdateEstimateNotification, mailUpdateEstimateNotification",
      deleted: "pushDeleteEstimateNotification, mailDeleteEstimateNotification",
    },
    invoice: {
      created: "pushNewInvoiceNotification, mailNewInvoiceNotification",
      updated: "pushUpdateInvoiceNotification, mailUpdateInvoiceNotification",
      deleted: "pushDeleteInvoiceNotification",
    },
    transaction: {
      created: "pushNewTransactionNotification, mailNewTransactionNotification",
    },
  },
  catalog: {
    documentation: {
      created:
        "pushNewDocumentationNotification, mailNewDocumentationNotification",
      updated:
        "pushUpdateDocumentationNotification, mailUpdateDocumentationNotification",
      deleted:
        "pushDeleteDocumentationNotification, mailDeleteDocumentationNotification",
    },
    service: {
      created: "pushNewServiceNotification, mailNewServiceNotification",
      updated: "pushUpdateServiceNotification, mailUpdateServiceNotification",
      deleted: "pushDeleteServiceNotification, mailDeleteServiceNotification",
    },
    service_media: {
      created:
        "pushNewServiceMediaNotification, mailNewServiceMediaNotification",
      
    },
    service_asset: {
      created:
        "pushNewServiceAssetNotification, mailNewServiceAssetNotification",
      updated:
        "pushUpdateServiceAssetNotification, mailUpdateServiceAssetNotification",
      deleted:
        "pushDeleteServiceAssetNotification, mailDeleteServiceAssetNotification",
    },
  },
  reviewComment: {
    comment: {
      created: "pushNewCommentNotification",
      updated: "pushUpdateCommentNotification",
    },
  },
};

export { Notification };
