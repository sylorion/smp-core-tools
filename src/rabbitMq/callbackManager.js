// /lib/rabbitmq/CallbackManager.js
import {
  createEntityInDatabase,
  updateEntityInDatabase,
  deleteEntityFromDatabase,
} from './handlerCRUDOperation.js';

/**
 * CallbackManager qui gère le CRUD et les événements spéciaux via muConsumers.
 */
export class CallbackManager {
  constructor(models, muConsumers, logger = console) {
    this.models = models;
    this.muConsumers = muConsumers; 
    this.logger = logger;
  }

  async handleEvent(serviceName, routingKey, eventData) {
    const serviceConfig = this.muConsumers[serviceName]; 

    if (!serviceConfig) {
      this.logger.warn(`[CallbackManager] No configuration found for service '${serviceName}'`);
      return;
    }

    const entityName = this.getEntityFromRoutingKey(routingKey);
    const operation = this.getOperationFromRoutingKey(routingKey);

    if (!entityName || !operation) {
      this.logger.warn(`[CallbackManager] Invalid routingKey format: '${routingKey}'`);
      return;
    }

    if (!serviceConfig.routingKeys.includes(routingKey) && !serviceConfig.specialEvents?.[routingKey]) {
      this.logger.warn(`[CallbackManager] Event '${routingKey}' is not managed by '${serviceName}'`);
      return;
    }

    // Exécuter d'abord le CRUD
    await this.executeCrud(entityName, operation, eventData);

    // Exécuter ensuite les callbacks spéciaux
    if (serviceConfig.specialEvents?.[routingKey]) {
      await this.executeSpecialCallbacks(serviceConfig.specialEvents[routingKey], eventData);
    }
  }

  async executeCrud(entityName, operation, eventData) {
    const model = this.getModel(entityName);
    if (!model) {
      this.logger.warn(`[CallbackManager] Model '${entityName}' not found. Skipping CRUD.`);
      return;
    }

    switch (operation) {
      case 'created':
        return createEntityInDatabase(model, eventData);
      case 'updated':
        return updateEntityInDatabase(model, eventData);
      case 'deleted':
        return deleteEntityFromDatabase(model, eventData.id);
      default:
        this.logger.warn(`[CallbackManager] Unknown operation '${operation}'. No CRUD performed.`);
    }
  }

  async executeSpecialCallbacks(callbacks, eventData) {
    for (const callback of callbacks) {
      try {
        await callback(eventData);
        this.logger.info(`[CallbackManager] Executed special callback: ${callback.name}`);
      } catch (error) {
        this.logger.error(`[CallbackManager] Error in special callback '${callback.name}':`, error);
      }
    }
  }

  getEntityFromRoutingKey(routingKey) {
    const parts = routingKey.split('.');
    return parts.length >= 3 ? parts[2] : null;
  }

  getOperationFromRoutingKey(routingKey) {
    const parts = routingKey.split('.');
    return parts.length >= 4 ? parts[3] : null;
  }

  getModel(entityName) {
    const normalized = entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase();
    return this.models[normalized] || null;
  }
}
