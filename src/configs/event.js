import amqp from 'amqplib';
import { createEntityInDatabase, updateEntityInDatabase, deleteEntityFromDatabase } from '../rabbitMq/handlerCRUDOperation.js';
import { handleEvent } from '../handler/notificationHandler.js';

 class RabbitMQService { // Service RabbitMQ pour la consommation et la publication de messages

  constructor(connectionURL, models, logger = null, durable = true) {
    console.log(models);  // Cela vous permet de vérifier que les modèles sont passés correctement

    this.connectionURL = connectionURL; // URL de connexion à RabbitMQ
    this.models = models; // Stocker les modèles passés au service
    this.connection = null;
    this.logger = logger;
    this.channel = null;
    this.exchangeDurable = durable;
    this.queueDurable = durable;
    this.ack = false;
  }
  async connect() { // Connexion à RabbitMQ
    this.connection = await amqp.connect(this.connectionURL);
    this.channel = await this.connection.createChannel();
  }

  async close() { // Fermeture de la connexion à RabbitMQ
    await this.channel.close();
    await this.connection.close();
  }



  /**
   * Compares the current microservice's subscriptions against a global configuration (SMPevents) to ensure they are valid.
   * @param {Object} SMPevents - The global configuration detailing valid event subscriptions for each microservice.
   * @param {Object} muConsumers - The microservices and their subscribed events to validate.
   */
  async verifySubscriptions(SMPevents, muConsumers) {
    Object.keys(muConsumers).forEach(service => {
      Object.keys(muConsumers[service]).forEach(entity => {
        const operations = muConsumers[service][entity];
        if (!SMPevents[service] || !SMPevents[service][entity]) {
          console.warn(`Warning: No event configurations found for ${service}.${entity} in SMPevents.`);
        } else {
          const validOperations = SMPevents[service][entity];
          const invalidOps = operations.filter(op => !validOperations.includes(op));
          if (invalidOps.length > 0) {
            console.warn(`Warning: Invalid operations ${invalidOps.join(', ')} for ${service}.${entity} not supported by SMPevents.`);
          }
        }
      });
    });
    console.log("Verification of subscriptions completed.");
  }

  /**
   * Souscrit à un échange de topic RabbitMQ pour la consommation des messages.
   * @param {string} exchangeTopic - Le nom de l'échange de topic.
   * @param {string} routingKey - La clé de routage pour filtrer les messages. ex : 'user.created'
   * @param {string} queueName - Le nom de la file de messages à laquelle souscrire.
   * @param {string} entityName - Le nom de l'entité correspondant aux messages.
   * @param {string} operation - Le type d'opération CRUD à exécuter (create, update, delete).
   * @returns {Promise<void>} Une promesse résolue une fois la souscription effectuée.
   */
  async subscribeTopic(exchangeTopic, routingKey, queueName, entityName, operation) {
    await this.channel.assertExchange(exchangeTopic, 'topic', { durable: this.exchangeDuration });
    await this.channel.assertQueue(queueName, { durable: this.queueDuration });
    await this.channel.bindQueue(queueName, exchangeTopic, routingKey);

    this.channel.consume(queueName, (receivedMsg) => {
      if (receivedMsg) { 
        const messageData = JSON.parse(receivedMsg.content.toString());
        try {
           /**
   * ajout du handlerCrudOperation car le crud des entités qui transitent est commun à toutes les consommations  pour la pertinence des donées dans le systeme
   * de plus on peut ajouter des fonctionnalités de validation et de transformation des données avant de les
   * persister dans la base de donnéesen une seule fois pour toutes les entités.
   * 
   * de plus ces fonctions de crud sont configurés  depuis le microservice qui les consomme, en effet celui ci choisis l'entité
   *  et les opérations qu'il veut consommer de celle ci dans son muConsumers.
  */
          this.handleCRUDOperation(entityName, operation, messageData); if (this.ack) {
            this.channel.ack(receivedMsg);
          }
          /* Utiliser handleEvent pour traiter les messages reçus
          * cela permet de declanccher la fonction handleEvent pour chaque message reçu
          * si la rounting key est configuré pour cela
          */
           handleEvent(routingKey, messageData);

          console.log(`Received message for ${entityName} with operation ${operation}:`, messageData);
        } catch (error) {
          console.error(`Error handling CRUD operation for ${entityName}: ${error}`);
          this.channel.nack(receivedMsg);
        }
      }
    });
  }

  async subscribeDirect(exchange, routingKey, queueName, callback) { 
    // xs 
    await this.channel.assertExchange(exchange, 'direct', { durable: this.exchangeDuration });
    await this.channel.assertQueue(queueName, { durable: this.queueDuration });
    await this.channel.bindQueue(queueName, exchange, routingKey);

    this.channel.consume(queueName, (receivedMsg) => {
      if (receivedMsg) {
        // Maybe return receivedMsg directly
        try {
           callback(receivedMsg.content);
          if (this.ack) {
            this.channel.ack(receivedMsg);
          }
        } catch (error) {
          console.error('Unable to read the  message : ', error);
          // push back to the  Queue ?
          if (this.ack) {
            this.channel.nack(receivedMsg);
          } else {
            if (this.logger) {
              logger.error('Msg lost ', receivedMsg);
            } else {
              console.error('Msg lost ', receivedMsg);
            }
          }
        }
      }
    });
  }

  /**
   * Publishes a message to a topic exchange with the specified routing key.
   *
   * @param {string} exchangeTopic - The name of the topic exchange.
   * @param {string} routingKey - The routing key for the message.
   * @param {any} message - The message to be published.
   * @param {object} [context={}] - Additional context for the message.
   * @param {object} [options={}] - Additional options for publishing the message.
   * @returns {Promise<void>} - A promise that resolves when the message is published.
   */
  async publishTopic(exchangeTopic, routingKey, message, context = {}, options = {}) {
    // Build the message with request ID, user ID and so on before transmitting
    const messageWithContext = {
      context: context,
      data: message
    };
    const messageBuffer = Buffer.from(JSON.stringify(messageWithContext));
    
    await this.channel.assertExchange(exchangeTopic, 'topic', { durable: options.durable ?? this.exchangeDurable });
    this.channel.publish(exchangeTopic, routingKey, messageBuffer, options);
  }

  async readyToPublishTopic(exchangeTopic, routingKey, message, context = {}, options = {}) {
    this.connect();
    this.publishTopic(exchangeTopic, routingKey, message, context, options);
    this.close
  }

  /**
 * Démarre les consommateurs RabbitMQ en fonction de la configuration des microservices.
 * @param {Object} microservices - La configuration des échanges et des entités à consommer pour chaque microservice.
 * @returns {Promise<void>} Une promesse résolue une fois les consommateurs configurés.
 */
  async startConsumers(microservices) {
    const µservice = process.env.SMP_MU_SERVICE_NAME; // Nom du microservice stocké dans la variable d'environnement

    await this.connect();
    for (const [microserviceName, config] of Object.entries(microservices)) {
      for (const [entityName, actions] of Object.entries(config)) {
        for (const action of actions) {
          const queueName = `${entityName}-${action}-${µservice}-queue`; // Utiliser le nom du microservice, le nom de l'entité et l'action dans le nom de la file d'attente
          const routingKey = `${entityName}.${action}`;
          const exchangeName = `${microserviceName}.events`; // Utiliser le nom du microservice pour le nom de l'échange
          console.log(`Preparing to subscribe to queue ${queueName} ...`);
          this.subscribeTopic(exchangeName, routingKey, queueName, entityName, action);
        }
      }
    }
    console.log("All consumers have been set up for all microservices.");
  }
 /**
 * Handle CRUD operations for a given entity based on operation type.
 * @param {string} entityName - The name of the entity for CRUD operation.
 * @param {string} operation - Type of CRUD operation ('created', 'updated', 'deleted').
 * @param {Object} messageData - Data associated with the CRUD operation.
 * @returns {Promise<Object>} A promise resolved with the result of the CRUD operation.
 * @throws {Error} If the model is not found or if the operation is not supported.
 */
async handleCRUDOperation(entityName, operation, messageData) {
  const model = this.models[entityName];

  // Parse the incoming JSON data
  let data = JSON.parse(messageData.data);

  // Dynamically construct the ID field name based on the entity name
  const idField = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'ID';

  // Correctly log the value of the dynamically named ID field
  console.log( idField, data[idField]);

  if (!model) {
    throw new Error(`Model not found for entity: ${entityName}`);
  }

  switch (operation) { // Execute the appropriate CRUD operation based on the operation type
    case 'created':
      return createEntityInDatabase(model, data, data[idField]);
    case 'updated':
      // Ensure the ID for update operation is fetched dynamically from the data object
      return updateEntityInDatabase(model, data, data[idField]);
    case 'deleted':
      // Ensure the ID for delete operation is fetched dynamically from the data object
      return deleteEntityFromDatabase(model, data[idField]);
    default:
      console.error(`Operation '${operation}' not supported for entity '${entityName}'.`);
      throw new Error(`Unsupported operation: ${operation}`);
  }
}


}

export  { RabbitMQService };


