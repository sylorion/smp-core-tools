import amqp from 'amqplib';
import { createEntityInDatabase, updateEntityInDatabase, deleteEntityFromDatabase } from '../rabbitMq/handlerCRUDOperation.js';
import { handleCallback } from '../handler/notificationHandler.js';
import { rabbitMQConfig } from '../configs/env.js';
import { ACTIONS } from '../rabbitMq/index.js';


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
    this.connectionURL = connectionURL;
    this.models = models;
    this.mailingService = mailingService;
    this.brevoMailingConfig = brevoMailingConfig;
    this.internalNotificationConfig = internalNotificationConfig;
    this.logger = logger;
    this.exchange = rabbitMQConfig.exchange;
    this.µservice = process.env.SMP_MU_SERVICE_NAME;
    this.durable = durable;
    this.channel = null;
    this.connection = null;
  }

  /**
   * Connect to RabbitMQ server.
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.connection && this.channel) return; // Avoid reconnecting if already connected
    try {
      this.connection = await amqp.connect(this.connectionURL);
      this.channel = await this.connection.createChannel();
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      if (this.logger) this.logger.error('Error connecting to RabbitMQ:', error);
    }
  }

  /**
   * Closes RabbitMQ connection.
   * @returns {Promise<void>}
   */
  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.channel = null;
    this.connection = null;
  }

/**
 * Verifies the subscriptions against the SMP events configuration.
 * @param {Object} SMPevents - Supported events for each service and entity.
 * @param {Object} muConsumers - The microservices consumers configuration.
 * @returns {void}
 */
async verifySubscriptions(SMPevents, muConsumers) {
  Object.keys(muConsumers).forEach(service => {
    Object.keys(muConsumers[service]).forEach(entity => {
      const entityConfig = muConsumers[service][entity];
      const operations = entityConfig.operations || [];
      const specialEvents = entityConfig.specialEvents || {};

      if (!Array.isArray(operations)) {
        console.warn(`[Warning]: Operations for ${entity} in service ${service} should be an array.`);
        return;
      }

      // Vérification des opérations CRUD standards
      const validEvents = SMPevents[entity] ? Object.values(SMPevents[entity]) : null;

      if (!validEvents) {
        console.warn(`[Warning]: No valid event configurations found for ${service}.${entity}.`);
      } else {
        // Vérifier les opérations CRUD
        const invalidOps = operations.filter(op => !validEvents.includes(`${entity}.${op}`));
        if (invalidOps.length > 0) {
          console.warn(`[Warning]: Invalid operations ${invalidOps.join(', ')} for ${service}.${entity}.`);
        }

        // Vérifier les événements spéciaux
        Object.keys(specialEvents).forEach(eventKey => {
          const specialEvent = specialEvents[eventKey].event;
          if (!validEvents.includes(specialEvent)) {
            console.warn(`[Warning]: Special event '${specialEvent}' for ${entity} in service ${service} is not defined in SMPevents.`);
          }
        });
      }
    });
  });
  console.log("Verification of subscriptions completed.");
}



  /**
   * Subscribe to a RabbitMQ topic and process incoming messages.
   * @param {string} exchangeTopic - Name of the topic exchange.
   * @param {string} routingKey - Routing key for the exchange.
   * @param {string} queueName - Name of the queue.
   * @param {string} entityName - Name of the entity.
   * @param {string} operation - The CRUD operation ('created', 'updated', 'deleted').
   * @param {Function} [callback=null] - Optional callback function for special events.
   * @returns {Promise<void>}
   */
  async subscribeTopic(exchangeTopic, routingKey, queueName, entityName, operation, callback = null) {
    await this.connect();
    await this.channel.assertExchange(exchangeTopic, 'topic', { durable: this.durable });
    await this.channel.assertQueue(queueName, { durable: this.durable });
    await this.channel.bindQueue(queueName, exchangeTopic, routingKey);
    console.log(`Subscribed to ${exchangeTopic} with routing key ${routingKey} for ${entityName} with operation ${operation}`);
    const notificationCrudEntities = ['User', 'UserOrganization', 'UserPreference'];
    this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const messageData = JSON.parse(msg.content.toString());
          const parsedData = JSON.parse(messageData.data);

          let idField, model;
          if (entityName && this.models[entityName]) {
            idField = `${entityName.charAt(0).toLowerCase()}${entityName.slice(1)}ID`;
            model = this.models[entityName];
          }

          if (callback) {
            await callback(parsedData, messageData, this.mailingService, this.brevoMailingConfig);
          } else if (entityName && model && ((this.µservice !== 'notification') || notificationCrudEntities.includes(entityName))) {
            switch (operation) {
              case ACTIONS.CREATED:
                await createEntityInDatabase(model, parsedData, parsedData[idField]);
                break;
              case ACTIONS.UPDATED:
                await updateEntityInDatabase(model, parsedData, parsedData[idField]);
                break;
              case ACTIONS.DELETED:
                await deleteEntityFromDatabase(model, parsedData[idField]);
                break;
              default:
                throw new Error('Invalid operation');
            }
          }

          if (this.µservice === 'notification') {
            await handleCallback(routingKey, messageData, this.mailingService, this.brevoMailingConfig, this.internalNotificationConfig, this.models.User, this.models.Notification);
          }

          console.log(`Processed message for ${entityName} with operation ${operation}`);
          this.channel.ack(msg);
        } catch (error) {
          console.error(`Error processing message for ${entityName}:`, error);
          this.channel.nack(msg, false, false);
          if (this.logger) this.logger.error(`Error processing message for ${entityName}: ${error}`);
        }
      }
    }, { noAck: false });
  }

/**
 * Publishes an event to the RabbitMQ exchange.
 * @param {string} event - The event string from SMPevents (e.g., 'SMPevents.User.visited').
 * @param {Object} data - The message payload to publish.
 * @param {Object} [options={}] - Additional options for publishing.
 * @returns {Promise<void>}
 */
async publish(event, data, options = {}) {
  const routingKey = event;  // L'événement est utilisé directement comme routingKey
  const formattedData = data ? { data: data.toJSON ? data.toJSON() : data } : {};

  const formattedMessage = JSON.stringify(formattedData);
  try {
   this.channel.publish(this.exchange, routingKey, Buffer.from(formattedMessage), options);
        console.log(`Event '${routingKey}' published successfully.`);
  } catch (error) {
    console.error(`Failed to publish event '${routingKey}':`, error);
    if (this.logger) this.logger.error(`Failed to publish event '${routingKey}': ${error}`);
  }
}



  /**
   * Starts consumers for the specified microservices.
   * @param {Object} microservices - The configuration of microservices and their operations.
   * @returns {Promise<void>}
   */
  async startConsumers(microservices) {
    await this.connect();

    for (const [microserviceName, config] of Object.entries(microservices)) {
      const exchangeName = `${microserviceName}.events`;
      for (const [entityName, entityConfig] of Object.entries(config)) {
        const { operations, specialEvents } = entityConfig;

        for (const operation of operations) {
          const queueName = `${entityName}-${operation}-${this.µservice}-queue`;
          const routingKey = `${entityName}.${operation}`;
          this.subscribeTopic(exchangeName, routingKey, queueName, entityName, operation);
        }

        if (specialEvents) {
          for (const [eventKey, eventConfig] of Object.entries(specialEvents)) {
            const { event, callback } = eventConfig;
            const queueName = `${entityName}-${eventKey}-${this.µservice}-queue`;
            const routingKey = event;
            this.subscribeTopic(exchangeName, routingKey, queueName, entityName, eventKey, callback);
          }
        }
      }
    }
    console.log("All consumers have been set up for all microservices.");
  }
}

export { RabbitMQService };
