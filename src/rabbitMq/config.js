/**
 * Configuration RabbitMQ pour éviter les timeouts et améliorer la stabilité
 */

export const RABBITMQ_CONFIG = {
  // Timeouts de connexion
  CONNECTION: {
    TIMEOUT: 30000, // 30 secondes
    HEARTBEAT: 30000, // 30 secondes
    CHANNEL_MAX: 0, // Pas de limite
  },
  
  // Reconnexion
  RECONNECT: {
    MAX_ATTEMPTS: 10,
    INITIAL_DELAY: 5000, // 5 secondes
    MAX_DELAY: 300000, // 5 minutes max
    BACKOFF_MULTIPLIER: 2, // Backoff exponentiel
  },
  
  // Traitement des messages
  MESSAGE: {
    PROCESSING_TIMEOUT: 60000, // 1 minute
    PREFETCH: 1, // Un message à la fois
    PERSISTENT: true, // Messages persistants
  },
  
  // Queues
  QUEUE: {
    DURABLE: true,
    MESSAGE_TTL: 86400000, // 24h
    EXPIRE_AFTER: 604800000, // 7 jours
    MAX_LENGTH: 10000, // Max 10k messages
  },
  
  // Heartbeat
  HEARTBEAT: {
    INTERVAL: 30000, // 30 secondes
    TIMEOUT: 10000, // 10 secondes
  },
  
  // Logging
  LOGGING: {
    ENABLE_DEBUG: process.env.NODE_ENV === 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  }
};

/**
 * Fonction utilitaire pour calculer le délai de reconnexion avec backoff exponentiel
 */
export function calculateReconnectDelay(attempt, config = RABBITMQ_CONFIG.RECONNECT) {
  const delay = config.INITIAL_DELAY * Math.pow(config.BACKOFF_MULTIPLIER, attempt - 1);
  return Math.min(delay, config.MAX_DELAY);
}

/**
 * Fonction utilitaire pour vérifier si une erreur est récupérable
 */
export function isRecoverableError(error) {
  const recoverableErrors = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'Heartbeat timeout',
    'Connection timeout',
    'Channel closed'
  ];
  
  return recoverableErrors.some(errType => 
    error.message.includes(errType) || error.code === errType
  );
}

/**
 * Fonction utilitaire pour créer des options de connexion RabbitMQ
 */
export function createConnectionOptions(env = process.env.NODE_ENV || 'development') {
  const baseOptions = {
    heartbeat: RABBITMQ_CONFIG.CONNECTION.HEARTBEAT / 1000,
    connectionTimeout: RABBITMQ_CONFIG.CONNECTION.TIMEOUT,
    channelMax: RABBITMQ_CONFIG.CONNECTION.CHANNEL_MAX,
  };

  if (env === 'staging' || env === 'production') {
    return {
      ...baseOptions,
      // Options TLS pour la production
      rejectUnauthorized: true,
    };
  }

  return baseOptions;
}
