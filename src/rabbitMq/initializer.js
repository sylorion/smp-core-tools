// /lib/rabbitmq/index.js
import { RabbitMQEventBus } from './eventBus.js';
import { CallbackManager } from './callbackManager.js';

export class RabbitMQInitializer {
  /**
   * @param {Object} params
   * @param {RabbitMQEventBus} params.eventBus
   * @param {Object} params.models
   * @param {Object} params.muConsumers
   * @param {string} params.serviceName - Nom du microservice (déduit de l'exchange)
   * @param {Object} [params.logger=console]
   */
  constructor({ eventBus, models, muConsumers, serviceName, logger = console }) {
    this.eventBus = eventBus;
    this.muConsumers = muConsumers;
    this.serviceName = serviceName;
    this.logger = logger;
    this.callbackManager = new CallbackManager(models, muConsumers, logger);
  }

  aggregateRoutingKeys() {
    const aggregated = [];
    for (const domainConfig of Object.values(this.muConsumers)) {
      if (domainConfig.routingKeys && Array.isArray(domainConfig.routingKeys)) {
        aggregated.push(...domainConfig.routingKeys);
      }
    }
    return aggregated;
  }

  async startAllConsumers() {
    // Génère automatiquement le nom de la queue à partir du serviceName, ex: "catalog-queue"
    const queueName = `${this.serviceName}-queue`;
    const aggregatedRoutingKeys = this.aggregateRoutingKeys();

    if (aggregatedRoutingKeys.length === 0) {
      this.logger.warn(`[RabbitMQInitializer] No routing keys found for service '${this.serviceName}'. Skipping.`);
      return;
    }

    try {
      await this.eventBus.assertAndBindQueue(queueName, aggregatedRoutingKeys);
      this.logger.info(
        `[RabbitMQInitializer] Queue '${queueName}' ready`
      );

      // Stocker les routing keys pour la restauration après reconnexion
      const consumerConfig = this.eventBus.consumers.get(queueName);
      if (consumerConfig) {
        consumerConfig.routingKeys = aggregatedRoutingKeys;
      }

      await this.eventBus.consume(queueName, async (routingKey, eventData) => {
        try {
          this.logger.info(
            `[RabbitMQInitializer] Received event '${routingKey}' in queue '${queueName}'. Processing...`
          );
          
          // Traitement avec timeout pour éviter les blocages
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Event processing timeout')), 60000); // 1 minute
          });
          
          await Promise.race([
            this.callbackManager.handleEvent(routingKey, eventData),
            timeoutPromise
          ]);
          
        } catch (callbackError) {
          this.logger.error(`[RabbitMQInitializer] Error processing event '${routingKey}':`, callbackError);
          
          // En cas d'erreur critique, on peut décider de redémarrer le consumer
          if (callbackError.message.includes('timeout') || callbackError.message.includes('connection')) {
            this.logger.warn(`[RabbitMQInitializer] Critical error detected, considering restart for queue '${queueName}'`);
          }
        }
      });
      
      this.logger.info(`[RabbitMQInitializer] Consumer started successfully for service '${this.serviceName}'`);
      
    } catch (error) {
      this.logger.error(
        `[RabbitMQInitializer] Error setting up consumer for service '${this.serviceName}' (queue '${queueName}'):`,
        error
      );
      
      // En cas d'erreur critique, on peut essayer de redémarrer après un délai
      setTimeout(() => {
        this.logger.info(`[RabbitMQInitializer] Attempting to restart consumer for service '${this.serviceName}'`);
        this.startAllConsumers().catch(err => {
          this.logger.error(`[RabbitMQInitializer] Failed to restart consumer:`, err);
        });
      }, 10000); // 10 secondes
    }
  }
}
 