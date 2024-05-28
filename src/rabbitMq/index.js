import { 
    savePlaceToDatabase,
    updatePlaceInDatabase,
    deletePlaceFromDatabase,
  } from "./handlerOperation/PlaceOperation.js";
  
  import {
    deleteCriteriaFromDatabase,
    updateCriteriaInDatabase,
    saveCriteriaToDatabase,
  } from "./handlerOperation/CriteriaOperation.js";
  
  import {
    deleteServiceFromDatabase,
    saveServiceToDatabase,
    updateServiceInDatabase,
  } from "./handlerOperation/ServiceOperation.js";
  
  import {
    deleteRoleFromDatabase,
    saveRoleToDatabase,
    updateRoleInDatabase,
  } from "./handlerOperation/RoleOperation.js";
  
  import {
    saveTagToDatabase,
    updateTagInDatabase,
    deleteTagFromDatabase,
  } from "./handlerOperation/TagOperation.js";
  
  import {
    saveTopicToDatabase,
    updateTopicInDatabase,
    deleteTopicFromDatabase,
  } from "./handlerOperation/TopicOperation.js";
  


  /**
 * @typedef {Function} CallbackFunction
 * @param {Object} data - The data to be processed by the callback.
 * @returns {Promise<void>} A promise that resolves after the callback has finished processing.
 */

/**
 * An object mapping action names to callback functions. Each callback function is responsible for
 * processing the message data associated with a particular action on an entity.
 *
 * For example, `saveOrganizationToDatabase` is called when a new organization is created and needs to be saved to the database.
 * `updateUserInDatabase` is invoked when an existing user is updated.
 * `deleteProfileFromDatabase` is used when a profile is to be deleted from the database.
 *
 * Each function is designed to handle specific business logic associated with these actions,
 * ensuring that the operations on the entity data are performed correctly and efficiently.
 *
 * @type {Object.<string, CallbackFunction>}
 * @property {CallbackFunction} saveProfileToDatabase - Handles the creation of a new profile.
 * @property {CallbackFunction} updateProfileInDatabase - Handles updates to an existing profile.
 * @property {CallbackFunction} deleteProfileFromDatabase - Handles the deletion of a profile.
 * @property {CallbackFunction} saveUserToDatabase - Handles the creation of a new user.
 * @property {CallbackFunction} updateUserInDatabase - Handles updates to an existing user.
 * @property {CallbackFunction} deleteUserFromDatabase - Handles the deletion of a user.
 * @property {CallbackFunction} saveOrganizationToDatabase - Handles the creation of a new organization.
 * @property {CallbackFunction} updateOrganizationInDatabase - Handles updates to an existing organization.
 * @property {CallbackFunction} deleteOrganizationFromDatabase - Handles the deletion of an organization.
 * @property {CallbackFunction} savePlaceToDatabase - Handles the creation of a new place.
 * @property {CallbackFunction} updatePlaceInDatabase - Handles updates to an existing place.
 * @property {CallbackFunction} deletePlaceFromDatabase - Handles the deletion of a place.
 */
/**
 * @typedef {Function} CallbackFunction
 * @param {Object} data - The data to be processed by the callback.
 * @returns {Promise<void>} A promise that resolves after the callback has finished processing.
 */

/**
 * An object mapping action names to callback functions. Each callback function is responsible for
 * processing the message data associated with a particular action on a Place entity.
 *
 * `savePlaceToDatabase` is called when a new place is created and needs to be saved to the database.
 * `updatePlaceInDatabase` is invoked when an existing place is updated.
 * `deletePlaceFromDatabase` is used when a place is to be deleted from the database.
 *
 * Each function is designed to handle specific business logic associated with these actions,
 * ensuring that the operations on the Place data are performed correctly and efficiently.
 *
 * @type {Object.<string, CallbackFunction>}
 * @property {CallbackFunction} savePlaceToDatabase - Handles the creation of a new place.
 * @property {CallbackFunction} updatePlaceInDatabase - Handles updates to an existing place.
 * @property {CallbackFunction} deletePlaceFromDatabase - Handles the deletion of a place.
 */
const callbacks = {
    savePlaceToDatabase: savePlaceToDatabase,
    updatePlaceInDatabase: updatePlaceInDatabase,
    deletePlaceFromDatabase: deletePlaceFromDatabase,
    deleteCriteriaFromDatabase: deleteCriteriaFromDatabase,
    updateCriteriaInDatabase: updateCriteriaInDatabase,
    saveCriteriaToDatabase: saveCriteriaToDatabase,
    deleteRoleFromDatabase: deleteRoleFromDatabase,
    saveRoleToDatabase: saveRoleToDatabase,
    updateRoleInDatabase: updateRoleInDatabase,
    deleteServiceFromDatabase: deleteServiceFromDatabase,
    saveServiceToDatabase: saveServiceToDatabase,
    updateServiceInDatabase: updateServiceInDatabase,
    saveTagToDatabase: saveTagToDatabase,
    updateTagInDatabase: updateTagInDatabase,
    deleteTagFromDatabase: deleteTagFromDatabase,
    saveTopicToDatabase: saveTopicToDatabase,
    updateTopicInDatabase: updateTopicInDatabase,
    deleteTopicFromDatabase: deleteTopicFromDatabase
  };
  
  
  // Exportations
  export {
    callbacks
  };
  