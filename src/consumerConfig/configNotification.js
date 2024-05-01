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
 * import { consumerConfigNotification } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [microservice, entities] of Object.entries(consumerConfigNotification)) {
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
const consumerConfigNotification = {
    userSpace: {
      user: {
        created: "saveUserToDatabase",
        updated: "updateUserInDatabase",
        deleted: "deleteUserFromDatabase",
      },
      user_role: {
        created: "saveUserRoleToDatabase",
        updated: "updateUserRoleInDatabase",
        deleted: "deleteUserRoleFromDatabase",
      },
      payment_method: {
        created: "savePaymentMethodToDatabase",
        updated: "updatePaymentMethodInDatabase",
        deleted: "deletePaymentMethodFromDatabase",
      },
      payment_config: {
        created: "savePaymentConfigToDatabase",
        updated: "updatePaymentConfigInDatabase",
        deleted: "deletePaymentConfigFromDatabase",
      }
    },
    accounting: {
      estimate: {
        created: "saveEstimateToDatabase",
        updated: "updateEstimateInDatabase",
        deleted: "deleteEstimateFromDatabase",
      },
      invoice: {
        created: "saveInvoiceToDatabase",
        updated: "updateInvoiceInDatabase",
        deleted: "deleteInvoiceFromDatabase",
      },
      transaction: {
        created: "saveTransactionToDatabase",
        updated: "updateTransactionInDatabase",
        deleted: "deleteTransactionFromDatabase",
      }
    },
    catalog: {
      documentation: {
        created: "saveDocumentationToDatabase",
        updated: "updateDocumentationInDatabase",
        deleted: "deleteDocumentationFromDatabase",
      },
      service: {
        created: "saveServiceToDatabase",
        updated: "updateServiceInDatabase",
        deleted: "deleteServiceFromDatabase",
      },
      service_media: {
        created: "saveServiceMediaToDatabase",
        updated: "updateServiceMediaInDatabase",
        deleted: "deleteServiceMediaFromDatabase",
      },
      service_asset: {
        created: "saveServiceAssetToDatabase",
        updated: "updateServiceAssetInDatabase",
        deleted: "deleteServiceAssetFromDatabase",
      }
    },
    reviewComment: {
        comment: {
          created: "saveCommentToDatabase",
          updated: "updateCommentInDatabase",
          deleted: "deleteCommentFromDatabase",
        },
        
      },


  };
  
  export { consumerConfigNotification };
  