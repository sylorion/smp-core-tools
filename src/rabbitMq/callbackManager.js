import { createEntityInDatabase, updateEntityInDatabase, deleteEntityFromDatabase } from './handlerCRUDOperation.js';

/**
 * CallbackManager class
 * Manages CRUD and special event callbacks for each entity in a microservice.
 */
class CallbackManager {
  /**
   * Initializes the CallbackManager with the models used for CRUD operations.
   * @param {Object} models - The models to be used for CRUD operations, typically provided by an ORM like Sequelize.
   */
  constructor(models) {
    this.models = models;
  }

  /**
   * Configures callbacks for each entity based on CRUD operations and special events.
   * Special event callbacks override CRUD callbacks for specific operations.
   * @param {Object} entityConfig - The configuration for the entity in muConsumers.
   * @param {string} serviceName - The name of the microservice (e.g., 'UserSpace').
   * @param {string} entityName - The name of the entity (e.g., 'User').
   * @returns {Object} An object containing the configured callbacks for each operation.
   */
  configureEntityCallbacks(entityConfig, serviceName, entityName) {
    const { operations = [], specialEvents = {} } = entityConfig;
    const configuredCallbacks = {};

    // Configure CRUD callbacks if no special event is defined for the operation
    try {
      const crudCallbacks = this.getCrudCallbacks(entityName);

      operations.forEach((operation) => {
        if (!specialEvents[operation]) {
          const crudCallback = crudCallbacks[operation];
          if (crudCallback) {
            configuredCallbacks[operation] = [crudCallback];
          }
        }
      });
    } catch (error) {
      console.warn(`CRUD callbacks could not be configured for entity '${entityName}': ${error.message}`);
    }

    // Add special event callbacks, overriding CRUD callbacks if necessary
    Object.entries(specialEvents).forEach(([operation, eventDetails]) => {
      if (eventDetails.callback && typeof eventDetails.callback === 'function') {
        configuredCallbacks[operation] = [eventDetails.callback];
      }
    });

    return configuredCallbacks;
  }

  /**
   * Executes all callbacks for a specified operation with the provided event data.
   * @param {string} operation - The name of the operation (e.g., 'created', 'updated').
   * @param {Array<Function>} callbacks - The list of callbacks to execute.
   * @param {Object} eventData - The data associated with the event.
   */
  executeCallbacks(operation, callbacks, eventData) {
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach((callback) => {
        if (typeof callback === 'function') {
          callback(eventData);
        }
      });
    } else {
      console.warn(`No callbacks found for operation: ${operation}`);
    }
  }

  /**
   * Retrieves the CRUD callbacks for a specified entity.
   * Each operation ('created', 'updated', 'deleted') is mapped to its corresponding handler.
   * @param {string} entityName - The name of the entity.
   * @returns {Object} An object containing the CRUD callbacks for each operation.
   * @throws Will throw an error if the model for the specified entity is not found.
   */
  getCrudCallbacks(entityName) {
    const normalizedEntityName = entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase();
    const model = this.models[normalizedEntityName];
    if (!model) {
      throw new Error(`Model not found for entity: ${normalizedEntityName}`);
    }
    return {
      created: (data) => createEntityInDatabase(model, data),
      updated: (data) => updateEntityInDatabase(model, data),
      deleted: (data) => deleteEntityFromDatabase(model, data.id),
    };
  }
}

export { CallbackManager };
