// callbackManager.js (dans la bibliothèque partagée)
import { SMPEvents } from './eventProducers.js';
import { createEntityInDatabase, updateEntityInDatabase, deleteEntityFromDatabase } from './handlerCRUDOperation.js';

/**
 * Gestionnaire de callbacks pour chaque entité et opération.
 * Gère les callbacks CRUD et personnalisés, et vérifie les abonnements dans SMPEvents.
 */
class CallbackManager {
  constructor(models) {
    this.models = models;

  }

  /**
   * Configure les callbacks CRUD et personnalisés pour chaque entité, en fonction des opérations spécifiées.
   * @param {Object} entityConfig - La configuration de l'entité dans muConsume.
   * @param {string} serviceName - Le nom du microservice (ex: 'UserSpace').
   * @param {string} entityName - Le nom de l'entité (ex: 'User').
   * @returns {Object} Un objet contenant les callbacks configurés pour chaque opération.
   */
  configureEntityCallbacks(entityConfig, serviceName, entityName) {
    const { operations = [], customCallbacks = {} } = entityConfig;
    const crudCallbacks = this.getCrudCallbacks(entityName);
    const configuredCallbacks = {};

    operations.forEach((operation) => {
      const customCallbackList = customCallbacks[operation] || [];
      const crudCallback = crudCallbacks[operation];
      configuredCallbacks[operation] = [...customCallbackList, crudCallback];
    });
    return configuredCallbacks;
  }

  /**
   * Exécute tous les callbacks pour une opération spécifiée avec les données d'événement.
   * @param {string} operation - Le nom de l'opération (e.g. 'created', 'updated').
   * @param {Array<Function>} callbacks - Liste des callbacks à exécuter.
   * @param {Object} eventData - Les données associées à l'événement.
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
   * Retourne les callbacks CRUD pour une entité donnée.
   * @param {string} entityName - Le nom de l'entité.
   * @returns {Object} Un objet contenant les callbacks CRUD pour chaque opération.
   */
  getCrudCallbacks(entityName) {
    const model = this.models[entityName];
    if (!model) {
      throw new Error(`Model not found for entity: ${entityName}`);
    }
    return {
      created: (data) => createEntityInDatabase(model, data), // Utilisation des fonctions CRUD de handlerCRUDOperation
      updated: (data) => updateEntityInDatabase(model, data),
      deleted: (data) => deleteEntityFromDatabase(model, data.id),
    };
  }
}

export { CallbackManager };
