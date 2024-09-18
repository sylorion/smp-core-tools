import { CallbackManager } from './callbackManager.js';

/**
 * Démarre le gestionnaire d'événements pour traiter les événements et exécuter les callbacks.
 * @param {Object} models - Les modèles du microservice.
 * @param {Object} muConsumers - La configuration des consommateurs dans muConsume.
 * @param {Object} rabbitMQService - Service RabbitMQ pour recevoir les événements.
 */
function startEventHandler(models, muConsumers, rabbitMQService) {
  const callbackManager = new CallbackManager(models);

  // Écouter les événements pour chaque entité et chaque opération définie dans muConsumers
  Object.entries(muConsumers).forEach(([serviceName, entities]) => {
    Object.entries(entities).forEach(([entityName, entityConfig]) => {
      const { operations = [] } = entityConfig;

      operations.forEach((operation) => {
        const queueName = `${entityName}-${operation}-${serviceName}-queue`;

        // Écoute des événements spécifiques à cette entité/opération
        rabbitMQService.listenForEvents(queueName, (routingKey, eventData) => {
          // Vérifier que routingKey est une chaîne valide avant d'appeler split
          if (typeof routingKey !== 'string' || !routingKey) {
            console.error(`Invalid event received: ${routingKey}`);
            return;
          }

          const [eventEntity, eventOperation] = routingKey.split('.');

          // Vérification que l'entité et l'opération correspondent
          if (eventEntity === entityName && eventOperation === operation) {
            const callbacks = callbackManager.configureEntityCallbacks(entityConfig, serviceName, entityName);
            if (callbacks[operation]) {
              console.log(`Executing callbacks for ${entityName}.${operation}`);
              callbackManager.executeCallbacks(operation, callbacks[operation], eventData);
            } else {
              console.warn(`No callbacks configured for ${entityName}.${operation}`);
            }
          } else {
            console.warn(`Received event ${routingKey} does not match ${entityName}.${operation}`);
          }
        });
      });
    });
  });
}

 
export { startEventHandler };
