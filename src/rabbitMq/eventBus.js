// /lib/rabbitmq/RabbitMQEventBus.js
import amqp from 'amqplib';
import fs from 'fs';
import { RABBITMQ_CONFIG, calculateReconnectDelay, isRecoverableError, createConnectionOptions } from './config.js';

/**
 * Gestionnaire d'événements RabbitMQ avec support conditionnel TLS et reconnexion automatique
 */
export class RabbitMQEventBus {
  constructor({ connectionURL, exchangeName, logger = console, durable = true, prefetch = 1 }) {
    this.connectionURL = connectionURL;
    this.exchangeName = exchangeName;
    this.logger = logger;
    this.durable = durable;
    this.prefetch = prefetch;
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = RABBITMQ_CONFIG.RECONNECT.MAX_ATTEMPTS;
    this.reconnectDelay = RABBITMQ_CONFIG.RECONNECT.INITIAL_DELAY;
    this.heartbeatInterval = RABBITMQ_CONFIG.HEARTBEAT.INTERVAL;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.consumers = new Map(); // Stocke les consumers actifs
  }

  /**
   * Se connecte à RabbitMQ avec gestion des erreurs et reconnexion
   */
  async connect() {
    if (this.isConnected) return;

    const env = process.env.NODE_ENV || 'development';
    let opts = createConnectionOptions(env);

    const isSecureEnv = env === 'staging' || env === 'production';
    if (isSecureEnv) {
      const certPath = process.env.CERT_PATH || 'tls.crt';
      const keyPath = process.env.KEY_PATH || 'tls.key';
      const caPath = process.env.CA_PATH || 'ca.crt';

      if (!certPath || !keyPath || !caPath) {
        throw new Error(
          `[RabbitMQEventBus] Missing TLS configuration in environment variables:
- RABBITMQ_TLS_CERT=${certPath}
- RABBITMQ_TLS_KEY=${keyPath}
- RABBITMQ_TLS_CA=${caPath}`
        );
      }

      try {
        opts = {
          ...opts,
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
          ca: [fs.readFileSync(caPath)],
          rejectUnauthorized: true,
          credentials: amqp.credentials.plain(
            process.env.RABBITMQ_USER || 'guest',
            process.env.RABBITMQ_PSWD || 'guest'
          ),
        };
      } catch (err) {
        throw new Error(`[RabbitMQEventBus] Failed to load TLS files: ${err.message}`);
      }
    }

    try {
      this.connection = await amqp.connect(this.connectionURL, opts);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: this.durable });

      this.channel.prefetch(this.prefetch);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Configurer les gestionnaires d'événements de connexion
      this.setupConnectionHandlers();
      
      // Démarrer le heartbeat
      this.startHeartbeat();
      
      this.logger.info('[RabbitMQEventBus] Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('[RabbitMQEventBus] Connection error:', error);
      this.isConnected = false;
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Configure les gestionnaires d'événements de connexion
   */
  setupConnectionHandlers() {
    if (!this.connection) return;

    // Gestion de la fermeture de connexion
    this.connection.on('close', (err) => {
      this.logger.warn('[RabbitMQEventBus] Connection closed', err);
      this.isConnected = false;
      this.stopHeartbeat();
      this.scheduleReconnect();
    });

    // Gestion des erreurs de connexion
    this.connection.on('error', (err) => {
      this.logger.error('[RabbitMQEventBus] Connection error:', err);
      this.isConnected = false;
      this.stopHeartbeat();
      this.scheduleReconnect();
    });

    // Gestion de la fermeture de canal
    this.channel.on('close', (err) => {
      this.logger.warn('[RabbitMQEventBus] Channel closed', err);
      this.isConnected = false;
      this.stopHeartbeat();
      this.scheduleReconnect();
    });

    // Gestion des erreurs de canal
    this.channel.on('error', (err) => {
      this.logger.error('[RabbitMQEventBus] Channel error:', err);
      this.isConnected = false;
      this.stopHeartbeat();
      this.scheduleReconnect();
    });
  }

  /**
   * Planifie une tentative de reconnexion
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('[RabbitMQEventBus] Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = calculateReconnectDelay(this.reconnectAttempts);
    
    this.logger.info(`[RabbitMQEventBus] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        // Restaurer les consumers après reconnexion
        await this.restoreConsumers();
      } catch (error) {
        this.logger.error('[RabbitMQEventBus] Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Démarre le heartbeat
   */
  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.channel) {
        try {
          // Envoyer un heartbeat en publiant un message de test
          this.channel.publish(this.exchangeName, 'heartbeat.test', Buffer.from('ping'));
        } catch (error) {
          this.logger.warn('[RabbitMQEventBus] Heartbeat failed:', error);
          this.isConnected = false;
          this.scheduleReconnect();
        }
      }
    }, this.heartbeatInterval);
  }

  /**
   * Arrête le heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Restaure les consumers après reconnexion
   */
  async restoreConsumers() {
    for (const [queueName, consumerConfig] of this.consumers) {
      try {
        await this.assertAndBindQueue(queueName, consumerConfig.routingKeys);
        await this.consume(queueName, consumerConfig.onMessage);
        this.logger.info(`[RabbitMQEventBus] Restored consumer for queue '${queueName}'`);
      } catch (error) {
        this.logger.error(`[RabbitMQEventBus] Failed to restore consumer for queue '${queueName}':`, error);
      }
    }
  }

  /**
   * Ferme proprement la connexion
   */
  async close() {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (!this.isConnected) return;
    
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      this.logger.info('[RabbitMQEventBus] Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('[RabbitMQEventBus] Error closing RabbitMQ connection:', error);
    }
  }

  /**
   * Crée une queue et la lie aux routing keys associées
   * @param {string} queueName - Nom de la queue (ex: "Catalog-Organization-queue")
   * @param {string[]} routingKeys - Liste des routing keys associées
   */
  async assertAndBindQueue(queueName, routingKeys) {
    if (!this.isConnected) await this.connect();
    
    try {
      await this.channel.assertQueue(queueName, { 
        durable: this.durable,
        arguments: {
          'x-message-ttl': 86400000, // TTL de 24h pour éviter l'accumulation
          'x-expires': 604800000, // Expire après 7 jours d'inactivité
        }
      });

      for (const rk of routingKeys) {
        await this.channel.bindQueue(queueName, this.exchangeName, rk);
        this.logger.info(`[RabbitMQEventBus] Queue '${queueName}' bound to routingKey '${rk}'`);
      }
    } catch (error) {
      this.logger.error(`[RabbitMQEventBus] Error binding queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Écoute une queue et exécute un callback pour chaque message reçu
   * @param {string} queueName - Nom de la queue à écouter
   * @param {Function} onMessage - Fonction de traitement des messages
   */
  async consume(queueName, onMessage) {
    if (!this.isConnected) await this.connect();
    
    // Stocker le consumer pour la restauration après reconnexion
    const consumerConfig = this.consumers.get(queueName);
    if (consumerConfig) {
      consumerConfig.onMessage = onMessage;
    } else {
      this.consumers.set(queueName, { onMessage, routingKeys: [] });
    }
    
    try {
      this.logger.info(`[RabbitMQEventBus] Start consuming messages from queue '${queueName}'`);
      
      const consumer = await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;
        
        try {
          const content = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;
          
          // Ignorer les messages de heartbeat
          if (routingKey === 'heartbeat.test') {
            this.channel.ack(msg);
            return;
          }
          
          this.logger.info(`[RabbitMQEventBus] Message received: routingKey='${routingKey}'`);

          // Exécution du callback avec timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Message processing timeout')), 30000);
          });
          
          await Promise.race([
            onMessage(routingKey, content),
            timeoutPromise
          ]);

          // Ack du message
          this.channel.ack(msg);
        } catch (err) {
          this.logger.error('[RabbitMQEventBus] Error processing message:', err);
          
          // Nack avec requeue = false pour éviter les boucles infinies
          this.channel.nack(msg, false, false);
        }
      });
      
      // Stocker le consumer pour pouvoir l'annuler si nécessaire
      this.consumers.get(queueName).consumer = consumer;
      
    } catch (error) {
      this.logger.error(`[RabbitMQEventBus] Error consuming from queue '${queueName}':`, error);
      throw error;
    }
  }

  /**
   * Publie un message sur une routingKey donnée
   * @param {string} routingKey - Routing key de l'événement (ex: "rk.organization.organization.created")
   * @param {object} data - Données à envoyer dans RabbitMQ
   */
  async publish(routingKey, data) {
    if (!this.isConnected) await this.connect();
    
    const payload = Buffer.from(JSON.stringify({ data }));
    try {
      const success = this.channel.publish(this.exchangeName, routingKey, payload, {
        persistent: true, // Rendre le message persistant
        mandatory: false, // Ne pas bloquer si la queue n'existe pas
      });
      
      if (success) {
        this.logger.info(`[RabbitMQEventBus] Published event to routingKey '${routingKey}'`);
      } else {
        this.logger.warn(`[RabbitMQEventBus] Failed to publish event to routingKey '${routingKey}' - channel write buffer full`);
      }
    } catch (error) {
      this.logger.error('[RabbitMQEventBus] Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Vérifie l'état de la connexion
   */
  isHealthy() {
    return this.isConnected && this.connection && this.channel;
  }
}

