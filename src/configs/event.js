import amqp from 'amqplib';
import { createEntityInDatabase, updateEntityInDatabase, deleteEntityFromDatabase } from '../handlerRabbit/handlerCRUDOperation.js';

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
   * Souscrit à un échange de topic RabbitMQ pour la consommation des messages.
   * @param {string} exchangeTopic - Le nom de l'échange de topic.
   * @param {string} routingKey - La clé de routage pour filtrer les messages.
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
 * Gère une opération CRUD sur une entité Sequelize.
 * @param {string} entityName - Le nom de l'entité Sequelize.
 * @param {string} operation - Le type d'opération CRUD à exécuter (create, update, delete).
 * @param {Object} data - Les données à utiliser pour l'opération CRUD.
 * @returns {Promise<void>} Une promesse résolue une fois l'opération CRUD effectuée.
 */
  async handleCRUDOperation(entityName, operation, data) {
    const model = this.models[entityName];
  
    // console.log(data);
    if (!model) {
      throw new Error(`Model not found for entity: ${entityName}`);
    }
  
    // Construct the ID field name based on the entity name
    const idField = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'ID';
  
    switch (operation) { // Exécuter l'opération CRUD appropriée en fonction du type d'opération
      case 'created':
        return createEntityInDatabase(model, data);
      case 'updated':
        // Ensure the ID for update operation is fetched dynamically from the data object
        return updateEntityInDatabase(model, data, data[idField]);
      case 'deleted':
        // Ensure the ID for delete operation is fetched dynamically from the data object
        return deleteEntityFromDatabase(model, data[idField]);
      default:
        console.error(`Opération non supportée '${operation}' pour l'entité '${entityName}'.`);
        throw new Error(`Opération non supportée : ${operation}`);
    }

  }


}

export  { RabbitMQService };


