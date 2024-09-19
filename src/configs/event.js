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
  }

  topicFromServiceName(serviceName){
    return (`${serviceName}.events`).toLowerCase();
  }
 
  queueFromServiceAndEntityName(serviceName, entityName){
    return (`${entityName}-${serviceName}-queue`).toLowerCase();
  }
  
  routingKeyFromOperationOnEntity(serviceName, entityName, operation){
    return (`rk.${serviceName}.${entityName}.${operation}`).toLowerCase();
  }
  /**
   * Connecte le service à RabbitMQ. Si la connexion est déjà établie, elle ne sera pas recréée.
   */
  async connect() {
    if (this.connection && this.channel) return; // Si déjà connecté, on ne reconnecte pas
    try {
      this.connection = await amqp.connect(this.connectionURL);
      this.channel = await this.connection.createChannel();
      if (this.logger) this.logger.info(`RabbitMQ Connected: ${new Date()}`);
      else console.log(`RabbitMQ Connected: ${new Date()}`);
    } catch (error) {
      if (this.logger) this.logger.error('Error connecting to RabbitMQ:', error);
      else console.error('Error connecting to RabbitMQ:', error);
    }
  }

  /**
   * Vérifie si les abonnements sont valides par rapport aux événements définis globalement.
   * @param {Object} consumerConfig - Configuration des consommateurs pour un microservice.
   */
  verifySubscriptions(consumerConfig) {
    Object.keys(consumerConfig).forEach((entityName) => {
      const entityConfig = consumerConfig[entityName];
      const operations = entityConfig.operations || [];

      // Récupère les événements valides pour l'entité
      const validEventsForEntity = this.validEvents[entityName] || [];
      // const rk = this.routingKeyFromOperationOnEntity(eventService, eventEntity, eventOperation);
      // Vérifie si toutes les opérations configurées sont valides
      const invalidOps = operations.filter((operation) => !validEventsForEntity.includes(`${entityName}.${operation}`));
      if (invalidOps.length > 0) {
        console.warn(`[Warning]: Invalid operations ${invalidOps.join(', ')} for ${entityName}`);
      }
    });
  }

  /**
   * Souscrit à un topic RabbitMQ et consomme les messages.
   * @param {string} exchangeTopic - Le topic RabbitMQ.
   * @param {string} routingKey - La clé de routage.
   * @param {string} queueName - Le nom de la file d'attente.
   */
  async subscribeTopic(exchangeTopic, routingKey, queueName) {
    await this.connect(); // Assurer la connexion avant de souscrire au topic
    await this.channel.assertExchange(exchangeTopic, 'topic', { durable: this.durable });
    await this.channel.assertQueue(queueName, { durable: this.durable });
    await this.channel.bindQueue(queueName, exchangeTopic, routingKey);

    this.channel.consume(queueName, (msg) => {
      if (msg) {
        try {
          const messageData = JSON.parse(msg.content.toString());
          console.log(`Message received on ${queueName}:`, messageData);
          this.channel.ack(msg); // Accuser réception du message
        } catch (error) {
          console.error(`Error processing message for ${queueName}:`, error);
          this.channel.nack(msg, false, false);
          if (this.logger) this.logger.error(`Error processing message for ${queueName}: ${error}`);
        }
      }
    }, { noAck: false });
  }

  /**
   * Publie un événement dans l'échange RabbitMQ.
   * @param {string} event - L'événement à publier.
   * @param {Object} data - Les données associées à l'événement.
   */
  async publish(rk, data) {
    await this.connect(); // Assurer la connexion avant de publier
    const formattedMessage = JSON.stringify({ data });
    try {
      const [eventService, eventEntity, eventOperation] = rk.split('.');
      const eventTopic = this.topicFromServiceName(eventService)
      // const eventQueue = this.queueFromServiceAndEntityName(eventService, eventEntity)
      const routingKey = this.routingKeyFromOperationOnEntity(eventService, eventEntity, eventOperation);
      this.channel.publish(this.eventTopic, routingKey, Buffer.from(formattedMessage));
      const msgSuccess = `Event '${routingKey}' published successfully.`; 
      if (this.logger) this.logger.info(msgSuccess);
      else console.log(msgSuccess);
    } catch (error) {
      const msgError = `Failed to publish event '${routingKey}': ${error}`; 
      if (this.logger) this.logger.error(msgError);
      else console.error(msgError);
    }
  }
 
  /**
 * Écoute les événements via RabbitMQ et déclenche une fonction de callback.
 * @param {string} queueName - Le nom de la file d'attente RabbitMQ à écouter.
 * @param {Function} onMessage - Fonction de callback appelée lorsque des messages sont reçus.
 */
async listenForEvents(queueName, onMessage) {
  await this.connect(); // Assurer la connexion avant d'écouter
  await this.channel.assertQueue(queueName, { durable: true });
  // Consommer les messages de la queue
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

/**
 * Démarre le gestionnaire d'événements pour traiter les événements et exécuter les callbacks. 
 * @param {Object} muConsumers - La configuration des consommateurs dans muConsume. 
 */
async startEventHandler(muConsumers) {
    await this.connect(); // Assurer la connexion avant de souscrire au topic
  // Écouter les événements pour chaque entité et chaque opération définie dans muConsumers
  Object.entries(muConsumers).forEach(async ([serviceName, entities]) => {
    const exchangeTopic = this.topicFromServiceName(serviceName);
      await this.channel.assertExchange(exchangeTopic, 'topic', { durable: this.durable });
    Object.entries(entities).forEach(async ([entityName, entityConfig]) => {
      const queueName = this.queueFromServiceAndEntityName(serviceName, entityName);
      const { operations = [] } = entityConfig;
      operations.forEach(async (operation) => {
        const routingKey = `${serviceName}.${entityName}.${operation}`;
        await Promise.all([
          this.channel.assertQueue(queueName, { durable: this.durable }),
          this.channel.bindQueue(queueName, exchangeTopic, routingKey)]
        );
        // Écoute des événements spécifiques à cette entité/opération
        this.listenForEvents(queueName, (routingKey, eventData) => {
          // Vérifier que routingKey est une chaîne valide avant d'appeler split
          if (typeof routingKey !== 'string' || !routingKey) {
            console.error(`Invalid event received: ${routingKey}`);
            return;
          }

          const [eventService, eventEntity, eventOperation] = routingKey.split('.');

          // Vérification que l'entité et l'opération correspondent
          if (eventEntity === entityName && eventOperation === operation && eventService == serviceName) {
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
        console.log(`RabbitMQ@Queue[${queueName}] binding routing key: ${routingKey}`);
      });
    });
  });
}


  /**
 * Démarre les consommateurs pour un microservice.
 * @param {Object} consumerConfig - La configuration des consommateurs pour un microservice.
 */
async startConsumers(consumerConfig) {
  this.verifySubscriptions(consumerConfig);
 await this.connect(); // Assurer la connexion avant de démarrer les consommateurs
  for (const [microserviceName, config] of Object.entries(consumerConfig)) {
    const exchangeName = `${microserviceName}.events`;

    for (const [entityName, entityConfig] of Object.entries(config)) {
      const { operations } = entityConfig;

      // Configurer les consommateurs pour les opérations CRUD
      operations.forEach((operation) => {
        const queueName = `${entityName}-${operation}-${microserviceName}-queue`; // Nom de la queue dynamique
        const routingKey = `${entityName}.${operation}`;
        this.subscribeTopic(exchangeName, routingKey, queueName);
        // console.log(`Consumer set up for ${entityName}.${operation} from ${exchangeName}`);
        console.log(`create: ${queueName} with routing key: ${routingKey}`);
      });
    }
  }
  console.log('All consumers have been set up.');
}

}

export { RabbitMQService };
