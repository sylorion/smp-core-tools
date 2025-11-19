// src/configs/cache.js
import redis from 'redis';
import fs from 'fs';
import { promisify } from 'util';
import { appConfig, cacheConfig } from './env.js';
import { logger } from './logger.js';

const { NODE_ENV } = process.env;
const useTls = ['staging', 'production'].includes(NODE_ENV);

let client, getAsync, setAsync, promiseClient;

if (!cacheConfig.host) {
  getAsync = null;
  setAsync = null;
} else {
  let socketOptions = {
    host: cacheConfig.host,
    port: cacheConfig.port,
  };

  if (useTls) {
    const sslOptions = {
      ca: process.env.CA_PATH ? fs.readFileSync(process.env.CA_PATH) : undefined,
      key: process.env.KEY_PATH ? fs.readFileSync(process.env.KEY_PATH) : undefined,
      cert: process.env.CERT_PATH ? fs.readFileSync(process.env.CERT_PATH) : undefined,
    };

    if (!sslOptions.ca || !sslOptions.key || !sslOptions.cert) {
      throw new Error('SSL options (CA_PATH, KEY_PATH, CERT_PATH) are required in staging or production environments.');
    }

    // For Redis Cluster, certificates may not include all node IPs in SANs
    // Use checkServerIdentity to bypass IP validation while keeping certificate validation
    socketOptions = {
      ...socketOptions,
      tls: true,
      rejectUnauthorized: true,
      checkServerIdentity: () => {
        // Bypass hostname/IP validation for Redis cluster nodes
        // The certificate is still validated (CA, signature, expiration)
        // This allows connections to cluster nodes even if IPs don't match SANs
        // This is safe for internal cluster connections where certificates are trusted
        return undefined; // Return undefined means "no error" = connection allowed
      },
      ...sslOptions,
    };
  }

  // Detect if we should use cluster mode based on environment or host pattern
  const useCluster = process.env.SMP_CACHE_CLUSTER === 'true' ||
                    cacheConfig.host.includes('cluster') ||
                    ['staging', 'production'].includes(NODE_ENV);

  if (useCluster) {
    // Use Redis Cluster client for production environments
    // Supports automatic handling of MOVED redirections
    logger.info('Initializing Redis Cluster client');
    client = redis.createCluster({
      rootNodes: [{
        socket: socketOptions,
        password: cacheConfig.password,
      }],
      // Additional cluster options for better error handling
      defaults: {
        password: cacheConfig.password,
        socket: {
          ...socketOptions,
          tls: useTls,
          // checkServerIdentity is already set in socketOptions above
        },
      },
      useReplicas: true, // Read from replicas when available
    });

    logger.info('Redis Cluster client initialized - will handle MOVED redirections automatically');
  } else {
    // Use standalone Redis client for development/local
    logger.info('Initializing standalone Redis client');
    client = redis.createClient({
      socket: socketOptions,
      password: cacheConfig.password,
    });
  }

  function connectionEstablished() {
    logger.info('Connected to Redis at ' + cacheConfig.host + ':' + cacheConfig.port);
  }

  function errorThrowing(err) {
    logger.error('Redis Client Error at ' + cacheConfig.host + ':' + cacheConfig.port, err);
  }

  client.on('error', errorThrowing);
  client.on('connect', connectionEstablished) ;
  promiseClient = async () => client.connect() ;
  
  // For cluster clients, methods are already promises, no need for promisify
  // For standalone clients, we use promisify
  if (useCluster) {
    // Cluster client methods are already async/promises
    getAsync = async (key) => {
      try {
        return await client.get(key);
      } catch (error) {
        logger.error('Redis GET error', error);
        throw error;
      }
    };
    setAsync = async (key, value, ...args) => {
      try {
        return await client.set(key, value, ...args);
      } catch (error) {
        logger.error('Redis SET error', error);
        throw error;
      }
    };
  } else {
    // Standalone client - use promisify
    getAsync = promisify(client.get).bind(client);
    setAsync = promisify(client.set).bind(client);
  }
}
const cache = { client, getAsync, setAsync, promiseClient }
export { cache };
