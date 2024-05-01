/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on the entities 'Organization', 'User', 'Profile', and 'Place'
 * within their respective microservices 'Organization', 'UserSpace', and 'Location'.
 *
 * The 'catalog' key represents the exchange name in RabbitMQ under which the events will be published.
 * It maps actions to specific callback functions for each entity managed by different microservices.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { consumerConfigCatalog } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [microservice, entities] of Object.entries(consumerConfigCatalog)) {
 *   for (const [entity, actions] of Object.entries(entities)) {
 *     for (const [action, callbackName] of Object.entries(actions)) {
 *       // Setup consumer for each action
 *       setupConsumer(microservice, entity, action, callbackName);
 *     }
 *   }
 * }
 *
 * @property {Object} organization - Manages events related to the 'Organization' entity within the 'Organization' microservice.
 * @property {Object} userSpace - Manages events related to 'User' and 'Profile' entities within the 'UserSpace' microservice.
 * @property {Object} location - Manages events related to the 'Place' entity within the 'Location' microservice.
 */
const consumerConfigCatalog = {
    organization: {
      organization: {
        created: "saveOrganizationToDatabase",
        updated: "updateOrganizationInDatabase",
        deleted: "deleteOrganizationFromDatabase",
      },
    },
    userSpace: {
      user: {
        created: "saveUserToDatabase",
        updated: "updateUserInDatabase",
        deleted: "deleteUserFromDatabase",
      },
      profile: {
        created: "saveProfileToDatabase",
        updated: "updateProfileInDatabase",
        deleted: "deleteProfileFromDatabase",
      }
    },
    location: {
      place: {
        created: "savePlaceToDatabase",
        updated: "updatePlaceInDatabase",
        deleted: "deletePlaceFromDatabase",
      },
    },
  };
  
  export { consumerConfigCatalog };
