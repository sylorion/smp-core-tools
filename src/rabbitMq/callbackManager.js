// /lib/rabbitmq/CallbackManager.js
import {
  createEntityInDatabase,
  updateEntityInDatabase,
  deleteEntityFromDatabase,
} from './handlerCRUDOperation.js';

export class CallbackManager {
  constructor(models, muConsumers, logger = console) {
    this.models = models;
    this.muConsumers = muConsumers; 
    this.logger = logger;
  }

  /**
   * Parcourt la configuration muConsumers pour trouver le domaine (clé) correspondant à la routing key.
   * @param {string} routingKey - La routing key reçue.
   * @returns {Object|null} - La configuration du domaine ou null si non trouvé.
   */
  findDomainConfig(routingKey) {
    console.log("@@@@@@@@@@@@@@@@---------------->", routingKey);
    for (const [domain, config] of Object.entries(this.muConsumers)) {
      if (config.routingKeys && Array.isArray(config.routingKeys)) {
        // On vérifie si l'une des routing keys correspond ou si un wildcard correspond.
        const found = config.routingKeys.some((rk) => {
          if (rk.endsWith('.*')) {
            // Si la clé se termine par wildcard, vérifier le préfixe
            const prefix = rk.slice(0, -1);
            return routingKey.startsWith(prefix);
          }
          return rk === routingKey;
        });
        if (found) return config;
      }
    }
    return null;
  }

  /**
   * Gère un événement reçu en identifiant le domaine approprié via la routing key.
   * @param {string} routingKey - La routing key reçue.
   * @param {Object} eventData - Les données associées à l'événement.
   */
  async handleEvent(routingKey, eventData) {
    console.log("@@@@@@@@@@@@@@@@---------------->", routingKey);

    const domainConfig = this.findDomainConfig(routingKey);
    if (!domainConfig) {
      this.logger.warn(`[CallbackManager] No configuration found for routingKey '${routingKey}'`);
      return;
    }

    // Extraction de l'entité et de l'opération depuis la routing key
    // Exemple: "rk.catalog.service.created" -> entity: "service", operation: "created"
    const parts = routingKey.split('.');
    if (parts.length < 4) {
      this.logger.warn(`[CallbackManager] Invalid routingKey format: '${routingKey}'`);
      return;
    }
    const entityName = parts[2];   // "service"
    const operation = parts[3];    // "created"

    // Exécuter d'abord le CRUD standard
    await this.executeCrud(entityName, operation, eventData);

    // Ensuite, exécuter les callbacks spéciaux si la configuration le prévoit
    if (domainConfig.specialEvents && domainConfig.specialEvents[routingKey]) {
      await this.executeSpecialCallbacks(domainConfig.specialEvents[routingKey], eventData);
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

  /**
   * Récupère le modèle associé à une entité.
   * Suppose que les modèles sont nommés en PascalCase.
   * @param {string} entityName - Nom de l'entité (ex: "service")
   * @returns {Object|null} - Le modèle ou null s'il n'existe pas.
   */
  getModel(entityName) {
    const normalized = entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase();
    return this.models[normalized] || null;
  }
}
