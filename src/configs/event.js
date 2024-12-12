// rabbitMQService.js (dans la bibliothèque partagée)
import amqp from 'amqplib';
import { CallbackManager } from '../rabbitMq/callbackManager.js';

class RabbitMQService {
  constructor(connectionURL, configEvents, models, logger = null, durable = true) {
    this.connectionURL = connectionURL;
    this.validEvents = configEvents; 
    this.logger = logger;
    this.durable = durable;
    this.exchange = process.env.RABBITMQ_EXCHANGE;
    this.models = models;
    this.connection = null;
    this.channel = null;
    this.callbackManager = new CallbackManager(models);
    this.isConnected = false;
  }

  topicFromServiceName(serviceName) {
    return `${serviceName}.events`.toLowerCase();
  }

  queueFromServiceAndEntityName(serviceName, entityName) {
    return `${entityName}-${serviceName}-queue`.toLowerCase();
  }

  routingKeyFromOperationOnEntity(serviceName, entityName, operation) {
    return `rk.${serviceName}.${entityName}.${operation}`.toLowerCase();
  }

  routingKeyFromOperationAndAppContext(entityName, operation) {
    return `rk.${entityName}.${operation}`.toLowerCase();
  }

  /**
   * Connects the service to RabbitMQ. If the connection is already established, it will not be recreated.
   */
  async connect() {
    if (this.isConnected) return; // If already connected, do not reconnect
    try {
      this.connection = await amqp.connect(this.connectionURL);
      this.channel = await this.connection.createChannel();
      this.logInfo(`RabbitMQ Connected: ${new Date()}`);
      this.isConnected = true;
    } catch (error) {
      this.logError('Error connecting to RabbitMQ:', error);
      this.isConnected = false;
    }
  }

  /**
   * Closes the RabbitMQ connection.
   */
  async close() {
    if (!this.isConnected) return; 
    try {
      await this.channel.close();
      await this.connection.close();
      this.logInfo(`RabbitMQ Disconnected: ${new Date()}`);
      this.isConnected = false;
    } catch (error) {
      this.logError('Error disconnecting from RabbitMQ:', error);
    }
  }

  /**
   * Verifies if the subscriptions are valid according to the globally defined events.
   * @param {Object} consumerConfig - Configuration of consumers for a microservice.
   */
  verifySubscriptions(consumerConfig) {
    Object.keys(consumerConfig).forEach((entityName) => {
      const entityConfig = consumerConfig[entityName];
      const operations = entityConfig.operations || [];
      const validEventsForEntity = this.validEvents[entityName] || [];
      const invalidOps = operations.filter((operation) => !validEventsForEntity.includes(`${entityName}.${operation}`));
      if (invalidOps.length > 0) {
        console.warn(`[Warning]: Invalid operations ${invalidOps.join(', ')} for ${entityName}`);
      }
    });
  }

  /**
   * Publishes an event to the RabbitMQ exchange.
   * @param {string} rk - The routing key.
   * @param {Object} data - The data associated with the event.
   */
  async publish(rk, data) {
    try {
      await this.connect();  
    } catch (error) {
      this.logError('Error connecting to RabbitMQ to publish event:', error);
      return;
    }
    const formattedMessage = JSON.stringify({ data });
    try {
      const [eventService, eventEntity, eventOperation] = rk.split('.');
      const eventTopic = this.topicFromServiceName(eventService);
      const routingKey = this.routingKeyFromOperationOnEntity(eventService, eventEntity, eventOperation);
      this.channel.publish(eventTopic, routingKey, Buffer.from(formattedMessage));
      this.logInfo(`Event published to topic ${eventTopic} with routing key '${routingKey}'`);
    } catch (error) {
      this.logError(`Failed to publish event '${rk}':`, error);
    }
  }

  /**
   * Listens for events via RabbitMQ and triggers a callback function.
   * @param {string} queueName - The name of the RabbitMQ queue to listen to.
   * @param {Function} onMessage - Callback function called when messages are received.
   */
  async listenForEvents(queueName, onMessage) {
    await this.connect();  
    if (this.isConnected) {
      await this.channel.assertQueue(queueName, { durable: true });
      this.channel.consume(queueName, (msg) => {
        if (msg !== null) {
          const messageContent = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;
          const eventData = messageContent.data;
          try {
            onMessage(routingKey, eventData); 
            this.channel.ack(msg);
          } catch (err) {
            this.channel.nack(msg);
          }
        }
      });
    }
  }

  /**
   * Logs an informational message.
   * @param {string} message - The message to log.
   */
  logInfo(message) {
    if (this.logger) {
      this.logger.info(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Logs an error message.
   * @param {string} message - The message to log.
   * @param {Error} error - The error object.
   */
  logError(message, error) {
    if (this.logger) {
      this.logger.error(message, error);
    } else {
      console.error(message, error);
    }
  }
  /**
   * Démarre le gestionnaire d'événements pour traiter les événements et exécuter les callbacks.
   * @param {Object} muConsumers - La configuration des consommateurs dans muConsume.
   */
  async startEventHandler(muConsumers) {
    await this.connect();
    if (!this.isConnected) {
      console.error('[Error]: Unable to start event handler, not connected to RabbitMQ.');
      return;
    }
  
    this.verifySubscriptions(muConsumers);
  
    // Process events for each entity and operation defined in muConsumers
    for (const [serviceName, entities] of Object.entries(muConsumers)) {
      const exchangeTopic = this.topicFromServiceName(serviceName);
  
      try {
        await this.channel.assertExchange(exchangeTopic, 'topic', { durable: this.durable });
      } catch (error) {
        console.error(`[Error]: Failed to assert exchange ${exchangeTopic}:`, error);
        continue;
      }
  
      for (const [entityName, entityConfig] of Object.entries(entities)) {
        const queueName = this.queueFromServiceAndEntityName(serviceName, entityName);
        const { operations = [] } = entityConfig;
  
        for (const operation of operations) {
          const routingKey = this.routingKeyFromOperationOnEntity(serviceName, entityName, operation);
  
          try {
            await Promise.all([
              this.channel.assertQueue(queueName, { durable: this.durable }),
              this.channel.bindQueue(queueName, exchangeTopic, routingKey),
            ]);
          } catch (error) {
            console.error(`[Error]: Failed to bind queue ${queueName} with routing key ${routingKey}:`, error);
            continue;
          }
  
          // Listen for specific events for the entity/operation
          this.listenForEvents(queueName, (routingKey, eventData) => {
            if (typeof routingKey !== 'string' || !routingKey) {
              console.error(`[Error]: Invalid event received: ${routingKey}`);
              return;
            }
  
            const [_, eventService, eventEntity, eventOperation] = routingKey.split('.');
            const normalizedEventEntity = eventEntity.toLowerCase();
            const normalizedEntityName = entityName.toLowerCase();
  
            if (
              normalizedEventEntity === normalizedEntityName &&
              eventOperation === operation &&
              eventService === serviceName
            ) {
              const callbacks = this.callbackManager.configureEntityCallbacks(entityConfig, serviceName, entityName);
  
              if (callbacks[operation]) {
                this.callbackManager.executeCallbacks(operation, callbacks[operation], eventData);
              }
            }
          });
        }
      }
    }
  }
}

export { RabbitMQService };
