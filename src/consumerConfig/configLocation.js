/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on entities within the microservices.
 *
 * The 'location' key represents the exchange name in RabbitMQ under which the events will be published.
 * Under each microservice, different entities (like 'profile') are listed with actions that can be performed on them.
 * Each action is associated with a specific callback function that handles the corresponding business logic.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { consumerConfigLocation } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [exchange, entities] of Object.entries(consumerConfigLocation)) {
 *   for (const [entity, actions] of Object.entries(entities)) {
 *     for (const [action, callbackName] of Object.entries(actions)) {
 *       // Setup consumer for each action
 *       setupConsumer(exchange, entity, action, callbackName);
 *     }
 *   }
 * }
 *
 * @property {Object} location - Represents the 'location' microservice, where events related to different entities are handled.
 * @property {Object} location.userSpace - Represents the 'userSpace' microservice.
 * @property {string} location.userSpace.profile.created - Callback function name for creating a profile. Invoked to save a new profile into the database.
 * @property {string} location.userSpace.profile.updated - Callback function name for updating a profile. Invoked to update a profile in the database.
 * @property {string} location.userSpace.profile.deleted - Callback function name for deleting a profile. Invoked to delete a profile from the database.
 */

const consumerConfigLocation = {
    userSpace: {
      profile: {
        created: "saveProfileToDatabase",
        updated: "updateProfileInDatabase",
        deleted: "deleteProfileFromDatabase",
      },
    },
  };
  
  export { consumerConfigLocation };
  