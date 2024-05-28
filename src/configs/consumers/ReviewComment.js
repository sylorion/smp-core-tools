/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on entities within the microservices.
 *
 * The 'reviewComment' key represents the exchange name in RabbitMQ under which the events will be published.
 * It maps actions to specific callback functions for entities managed by the 'Organization', 'Catalogue', and 'UserSpace' microservices.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { ReviewComment } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [microservice, entities] of Object.entries(ReviewComment)) {
 *   for (const [entity, actions] of Object.entries(entities)) {
 *     for (const [action, callbackName] of Object.entries(actions)) {
 *       // Setup consumer for each action
 *       setupConsumer(microservice, entity, action, callbackName);
 *     }
 *   }
 * }
 *
 * @property {Object} organization - Manages events related to the 'Organization' entity within the 'Organization' microservice.
 * @property {Object} catalogue - Manages events related to 'Service' and 'Criteria' entities within the 'Catalogue' microservice.
 * @property {Object} userSpace - Manages events related to the 'User' entity within the 'UserSpace' microservice.
 */
const ReviewComment = {
    organization: {
      organization: {
        created: "saveOrganizationToDatabase",
        updated: "updateOrganizationInDatabase",
        deleted: "deleteOrganizationFromDatabase",
      },
    },
    catalog: {
      service: {
        created: "saveServiceToDatabase",
        updated: "updateServiceInDatabase",
        deleted: "deleteServiceFromDatabase",
      },
      criteria: {
        created: "saveCriteriaToDatabase",
        updated: "updateCriteriaInDatabase",
        deleted: "deleteCriteriaFromDatabase",
      }
    },
    userSpace: {
      user: {
        created: "saveUserToDatabase",
        updated: "updateUserInDatabase",
        deleted: "deleteUserFromDatabase",
      }
    },
  };
  
  export { ReviewComment };
  