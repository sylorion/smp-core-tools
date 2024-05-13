/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on entities within the microservices.
 *
 * The 'location' key represents the exchange name in RabbitMQ under which the events will be published.
 * Under each microservice, different entities (like 'place') are listed with actions that can be performed on them.
 * Each action is associated with a specific callback function that handles the corresponding business logic.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { consumerConfigOrganization } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [exchange, entities] of Object.entries(consumerConfigOrganization)) {
 *   for (const [entity, actions] of Object.entries(entities)) {
 *     for (const [action, callbackName] of Object.entries(actions)) {
 *       // Setup consumer for each action
 *       setupConsumer(exchange, entity, action, callbackName);
 *     }
 *   }
 * }
 *
 * @property {Object} location - Represents the 'location' microservice, where events related to different entities are handled.
 * @property {Object} location.place - Represents the 'place' entity in the 'location' microservice.
 * @property {string} location.place.created - Callback function name for creating a place. Invoked to save a new place into the database.
 * @property {string} location.place.updated - Callback function name for updating a place. Invoked to update a place in the database.
 * @property {string} location.place.deleted - Callback function name for deleting a place. Invoked to delete a place from the database.
 */
const consumerConfigOrganization = {
  location: {
    place: {
      created: "savePlaceToDatabase",
      updated: "updatePlaceInDatabase",
      deleted: "deletePlaceFromDatabase",
    },
  },
  catalog: {
    criteria: {
      created: "saveCriteriaToDatabase",
      updated: "updateCriteriaInDatabase",
      deleted: "deleteCriteriaFromDatabase",
    },
    service: {
      created: "saveServiceToDatabase",
      updated: "updateServiceInDatabase",
      deleted: "deleteServiceFromDatabase",
    },

    topic: {
      created: "saveTopicToDatabase",
      updated: "updateTopicInDatabase",
      deleted: "deleteTopicFromDatabase",
    },
    tag: {
      created: "saveTagToDatabase",
      updated: "updateTagInDatabase",
      deleted: "deleteTagFromDatabase",
    },
  },
  userSpace: {
    role: {
      created: "saveRoleToDatabase",
      updated: "updateRoleInDatabase",
      deleted: "deleteRoleFromDatabase",
    },
    user:{
      created: "saveUserToDatabase",
      updated: "updateUserInDatabase",
      deleted: "deleteUserFromDatabase",
    },
    profile: {
      created: "saveProfileToDatabase",
      updated: "updateProfileInDatabase",
      deleted: "deleteProfileFromDatabase",
    },
  },
  accounting: {
    estimate: {
      created: "saveEstimateToDatabase",
      updated: "updateEstimateInDatabase",
      deleted: "deleteEstimateFromDatabase",
    },
  },
  reviewComment: {
    Comment: {
      created: "saveCommentToDatabase",
      updated: "updateCommentInDatabase",
      deleted: "deleteCommentFromDatabase",
    },
  },
};

export { consumerConfigOrganization };
