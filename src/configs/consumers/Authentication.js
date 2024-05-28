/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on the 'User' entity within the 'UserSpace' microservice.
 *
 * The 'authentication' key represents the exchange name in RabbitMQ under which the events will be published.
 * It maps actions to specific callback functions for the 'User' entity managed by the 'UserSpace' microservice.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { Authentication } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [entity, actions] of Object.entries(Authentication.userSpace)) {
 *   for (const [action, callbackName] of Object.entries(actions)) {
 *     // Setup consumer for each action
 *     setupConsumer('UserSpace', 'user', action, callbackName);
 *   }
 * }
 *
 * @property {Object} userSpace - Represents the 'UserSpace' microservice, where events related to the 'User' entity are handled.
 * @property {string} userSpace.user.created - Callback function name for creating a user. Invoked to handle user creation.
 * @property {string} userSpace.user.updated - Callback function name for updating a user. Invoked to handle user updates.
 * @property {string} userSpace.user.deleted - Callback function name for deleting a user. Invoked to handle user deletions.
 */
const Authentication = {
    userSpace: {
      user: {
        created: "saveUserToDatabase",
        updated: "updateUserInDatabase",
        deleted: "deleteUserFromDatabase",
      },
    },
  };
  
  export { Authentication };
  