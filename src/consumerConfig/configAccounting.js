/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on the entities 'PaymentMethod', 'PaymentConfig', 'Service',
 * 'ServiceCategory', 'ServiceAsset' within the 'Catalog' microservice and 'Profile' within the 'UserSpace' microservice.
 *
 * The 'accounting' key represents the exchange name in RabbitMQ under which the events will be published.
 * It maps actions to specific callback functions for each entity managed by the respective microservices.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { consumerConfigAccounting } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [microservice, entities] of Object.entries(consumerConfigAccounting)) {
 *   for (const [entity, actions] of Object.entries(entities)) {
 *     for (const [action, callbackName] of Object.entries(actions)) {
 *       // Setup consumer for each action
 *       setupConsumer(microservice, entity, action, callbackName);
 *     }
 *   }
 * }
 *
 * @property {Object} catalog - Manages events related to 'PaymentMethod', 'PaymentConfig', 'Service', 'ServiceCategory', 'ServiceAsset' entities within the 'Catalog' microservice.
 * @property {Object} userSpace - Manages events related to the 'Profile' entity within the 'UserSpace' microservice.
 */
const consumerConfigAccounting = {
    catalog: {
      payment_method: {
        created: "savePaymentMethodToDatabase",
        updated: "updatePaymentMethodInDatabase",
        deleted: "deletePaymentMethodFromDatabase",
      },
      payment_config: {
        created: "savePaymentConfigToDatabase",
        updated: "updatePaymentConfigInDatabase",
        deleted: "deletePaymentConfigFromDatabase",
      },
      service: {
        created: "saveServiceToDatabase",
        updated: "updateServiceInDatabase",
        deleted: "deleteServiceFromDatabase",
      },
      
      service_asset: {
        created: "saveServiceAssetToDatabase",
        updated: "updateServiceAssetInDatabase",
        deleted: "deleteServiceAssetFromDatabase",
      }
    },
    userSpace: {
      profile: {
        created: "saveProfileToDatabase",
        updated: "updateProfileInDatabase",
        deleted: "deleteProfileFromDatabase",
      }
    },
  };
  
  export { consumerConfigAccounting };
  