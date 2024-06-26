import amqp from 'amqplib';
import { createEntityInDatabase, updateEntityInDatabase, deleteEntityFromDatabase } from '../rabbitMq/handlerCRUDOperation.js';
import { handleCallback } from '../handler/notificationHandler.js';

/**
 * RabbitMQService class to manage interactions with RabbitMQ.
 */
class RabbitMQService {
  /**
   * Constructor to initialize RabbitMQService.
   * @param {string} connectionURL - URL of the RabbitMQ server.
   * @param {Object} models - Database models.
   * @param {Object} mailingService - Mailing service.
   * @param {Object} brevoMailingConfig - Brevo mailing configuration.
   * @param {Object} internalNotificationConfig - Internal notification configuration.
   * @param {Object} [logger=null] - Logger for logging purposes.
   * @param {boolean} [durable=true] - Whether exchanges and queues are durable.
   */
  constructor(connectionURL, models, mailingService, brevoMailingConfig, internalNotificationConfig, logger = null, durable = true) {
    this.mailingService = mailingService;
    this.connectionURL = connectionURL;
    this.models = models;
    this.brevoMailingConfig = brevoMailingConfig;
    this.internalNotificationConfig = internalNotificationConfig;
    this.connection = null;
    this.logger = logger;
    this.channel = null;
    this.exchangeDurable = durable;
    this.queueDurable = durable;
    this.ack = true; // Acknowledge messages by default to prevent message loss in case of error
  }

  /**
   * Connects to RabbitMQ server.
   */
  async connect() {
    try {
      this.connection = await amqp.connect(this.connectionURL);
      this.channel = await this.connection.createChannel();
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
    }
  }

  /**
   * Closes the RabbitMQ connection.
   */
  async close() {
    await this.channel.close();
    await this.connection.close();
  }

/**
 * Verifies the subscriptions against the SMP events configuration.
 *
 * This method compares the subscription operations of microservices with the SMP events configuration
 * to ensure that the operations are valid and supported. It warns if invalid operations are detected
 * or if event configurations are missing.
 *
 * @param {Object} SMPevents - The SMP events configuration. This object describes the supported events for each service and entity.
 * @param {Object} muConsumers - The microservices consumers configuration. This object describes the operations each service and entity is subscribed to.
 *
 * This method performs the following steps:
 * 1. Iterates through all services defined in the microservices consumers configuration (`muConsumers`).
 * 2. For each service, iterates through all entities and their operation configurations.
 * 3. Checks if the operations defined for each entity are valid against the SMP events configuration (`SMPevents`).
 * 4. Warns if invalid operations are found or if no valid event configuration is available for a given entity.
 *
 * Usage:
 * This method is used to validate that microservices are properly configured to subscribe to the appropriate events
 * and to avoid configuration errors.
 *
 * Example:
 * await rabbitMQService.verifySubscriptions(SMPevents, muConsumers);
 */
  async verifySubscriptions(SMPevents, muConsumers) {
    Object.keys(muConsumers).forEach(service => {
      Object.keys(muConsumers[service]).forEach(entity => {
        const entityConfig = muConsumers[service][entity];
        const operations = entityConfig.operations || [];

        if (!Array.isArray(operations)) {
          console.warn(`[Warning]: Operations for ${entity} in service ${service} should be an array.`);
          return;
        }

        if (!SMPevents[service] || !SMPevents[service][entity] || !Array.isArray(SMPevents[service][entity].operations)) {
          console.warn(`[Warning]: No valid event configurations found for ${service}.${entity} in SMPevents.`);
        } else {
          const validOperations = SMPevents[service][entity].operations;
          if (!Array.isArray(validOperations)) {
            console.warn(`[Warning]: Valid operations for ${service}.${entity} should be an array.`);
            return;
          }

          const invalidOps = operations.filter(op => !validOperations.includes(op));
          if (invalidOps.length > 0) {
            console.warn(`[Warning]: Invalid operations ${invalidOps.join(', ')} for ${service}.${entity} not supported by SMPevents.`);
          }
        }
      });
    });
    console.log("Verification of subscriptions completed.");
  }

  /**
 * Subscribes to a RabbitMQ topic and processes incoming messages.
 *
 * This method sets up a consumer for a specified RabbitMQ topic, queue, and routing key.
 * It processes messages by invoking either a general callback function or an entity-specific
 * CRUD operation handler. It also supports handling special events through dedicated callback functions.
 * 
 * **Special Case: Notification Service**
 * If the current microservice is the notification service, this method handles messages 
 * differently by invoking a general notification handler, `handleCallback`, which manages
 * sending emails and recording notifications based on the message data.
 *
 * @param {string} exchangeTopic - The name of the topic exchange to subscribe to.
 * @param {string} routingKey - The routing key used to filter messages in the exchange.
 * @param {string} queueName - The name of the queue to bind to the exchange and routing key.
 * @param {string} entityName - The name of the entity being processed (used for CRUD operations).
 * @param {string} operation - The CRUD operation being performed (created, updated, deleted).
 * @param {Function} handleCallback - The general callback function to handle messages.
 * @param {Object} data - Additional data to process (currently not used but can be extended for future use).
 * @param {Function} callback - A specific callback function for handling special events.
 *
 * This method performs the following steps:
 * 1. Asserts the existence of the specified exchange and queue, and binds them together using the routing key.
 * 2. Sets up a consumer for the queue to listen for incoming messages.
 * 3. Parses the received message and determines the appropriate action based on the provided parameters.
 * 4. If a specific callback function is provided, it invokes this function to handle the message.
 * 5. If no specific callback is provided, it performs entity-specific CRUD operations if applicable.
 * 6. If the current microservice is the notification service, it invokes a general notification handler.
 * 7. Acknowledges the message if processed successfully, or rejects it in case of an error.
 *
 * The function is designed to handle both standard CRUD operations for entities and custom event handling
 * for special cases, providing a flexible and extensible way to process messages in a RabbitMQ-based system.
 *
 * Usage:
 * This method is typically used within a microservice to set up consumers for various events
 * and operations, ensuring that the appropriate logic is executed when messages are received.
 *
 * Example:
 * rabbitMQService.subscribeTopic(
 *   'userSpace.events',
 *   'User.created',
 *   'user-created-queue',
 *   'User',
 *   'created',
 *   handleCallback,
 *   null,
 *   customUserCreatedCallback
 * );
 */
  async subscribeTopic(exchangeTopic, routingKey, queueName, entityName, operation, handleCallback, data, callback) {
    await this.channel.assertExchange(exchangeTopic, 'topic', { durable: this.exchangeDurable });
    await this.channel.assertQueue(queueName, { durable: this.queueDurable });
    await this.channel.bindQueue(queueName, exchangeTopic, routingKey);
  
    const notificationCrudEntities = ['User', 'UserOrganization', 'UserPreference'];
    const µservice = process.env.SMP_MU_SERVICE_NAME;
  
    this.channel.consume(queueName, async (receivedMsg) => {
      if (receivedMsg) {
        const messageData = JSON.parse(receivedMsg.content.toString());
        try {
          console.log(`Processing message with routingKey: ${routingKey} and messageData:`, messageData);
  
          const parsedData = JSON.parse(messageData.data); // Parse the 'data' field
          let idField, model;
  
          if (entityName && this.models[entityName]) {
            idField = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'ID';
            model = this.models[entityName];
          }
  
          if (callback) {
            await callback(parsedData, messageData, this.mailingService, this.brevoMailingConfig);
          } else if (entityName && model) {
            if ((µservice !== 'notification') || notificationCrudEntities.includes(entityName)) {
              switch (operation) {
                case 'created':
                  await createEntityInDatabase(model, parsedData, parsedData[idField]);
                  break;
                case 'updated':
                  await updateEntityInDatabase(model, parsedData, parsedData[idField]);
                  break;
                case 'deleted':
                  await deleteEntityFromDatabase(model, parsedData[idField]);
                  break;
                default:
                  throw new Error('Invalid operation');
              }
            }
  
            if (µservice === 'notification') {
              await handleCallback(routingKey, messageData, this.mailingService, this.brevoMailingConfig, this.internalNotificationConfig, this.models.User, this.models.Notification);
            }
          }
  
          console.log(`Processed message for ${entityName} with operation ${operation}:`, messageData);
  
          this.channel.ack(receivedMsg);
        } catch (error) {
          console.error(`Error processing message for ${entityName}: ${error}`);
          this.channel.nack(receivedMsg, false, false);
  
          if (this.logger) {
            this.logger.error(`Error processing message for ${entityName}: ${error}`);
          } else {
            console.error(`Error processing message for ${entityName}: ${error}`);
          }
        }
      }
    }, { noAck: false });
  }
  
  /**
   * Publishes a message to a RabbitMQ topic.
   * @param {string} exchangeTopic - Name of the topic exchange.
   * @param {string} routingKey - Routing key for the exchange.
   * @param {Object} message - Message to publish.
   * @param {Object} [context={}] - Context of the message.
   * @param {Object} [options={}] - Additional options for publishing.
   */
  async publishTopic(exchangeTopic, routingKey, message, context = {}, options = {}) {
    const messageWithContext = {
      context: context,
      data: message
    };
    const messageBuffer = Buffer.from(JSON.stringify(messageWithContext));

    await this.channel.assertExchange(exchangeTopic, 'topic', { durable: options.durable ?? this.exchangeDurable });
    this.channel.publish(exchangeTopic, routingKey, messageBuffer, options);
  }

  /**
   * Prepares to publish a message to a RabbitMQ topic by connecting, publishing, and closing the connection.
   * @param {string} exchangeTopic - Name of the topic exchange.
   * @param {string} routingKey - Routing key for the exchange.
   * @param {Object} message - Message to publish.
   * @param {Object} [context={}] - Context of the message.
   * @param {Object} [options={}] - Additional options for publishing.
   */
  async readyToPublishTopic(exchangeTopic, routingKey, message, context = {}, options = {}) {
    await this.connect();
    await this.publishTopic(exchangeTopic, routingKey, message, context, options);
    await this.close();
  }



  /**
 * Starts consumers for the specified microservices.
 *
 * This method sets up consumers for the specified microservices based on their configuration.
 * It subscribes to the appropriate RabbitMQ queues and binds them to the specified exchanges
 * and routing keys. It handles both standard CRUD operations and special events with custom callbacks.
 *
 * @param {Object} microservices - The configuration of microservices and their operations (muConsumers in the microservice).
 *
 * This method performs the following steps:
 * 1. Connects to the RabbitMQ server.
 * 2. Iterates through all microservices defined in the `microservices` configuration.
 * 3. For each microservice, iterates through all entities and their operation configurations.
 * 4. Subscribes to the appropriate queues for standard CRUD operations.
 * 5. Subscribes to special event queues with custom callbacks if defined.
 * 6. Logs the status of each subscription.
 *
 * Usage:
 * This method is used to set up consumers for microservices to listen for specific events
 * and perform actions based on those events.
 *
 * Example:
 * await rabbitMQService.startConsumers(microservices);
 */
  async startConsumers(microservices) {
    const µservice = process.env.SMP_MU_SERVICE_NAME;
  
    await this.connect();
    for (const [microserviceName, config] of Object.entries(microservices)) {
      for (const [entityName, entityConfig] of Object.entries(config)) {
        const { operations, specialEvents } = entityConfig;
        const exchangeName = `${microserviceName}.events`; // Définir exchangeName ici
  
        for (const operation of operations) {
          const queueName = `${entityName}-${operation}-${µservice}-queue`;
          const routingKey = `${entityName}.${operation}`;
  
          console.log(`Preparing to subscribe to queue ${queueName} ...`);
  
          this.subscribeTopic(exchangeName, routingKey, queueName, entityName, operation, handleCallback, null, null);
        }
  
        if (specialEvents) {
          for (const [eventKey, eventConfig] of Object.entries(specialEvents)) {
            const { event, callback } = eventConfig;
            const queueName = `${entityName}-${eventKey}-${µservice}-queue`;
            const routingKey = event;
  
            console.log(`Preparing to subscribe to queue ${queueName} for special event ${event}...`);
  
            this.subscribeTopic(exchangeName, routingKey, queueName, entityName, eventKey, handleCallback, null, callback);
          }
        }
      }
    }
    console.log("All consumers have been set up for all microservices.");
  }
  
  
}

export { RabbitMQService };
