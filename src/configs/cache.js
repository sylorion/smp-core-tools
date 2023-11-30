// src/configs/cache.js
import redis from 'redis';
import { promisify } from 'util';

import { appConfig, cacheConfig } from './env.js'
import { logger } from './logger.js'

let client
let getAsync
let setAsync
let promiseClient
if (appConfig.envExc !== 'dev'){

  getAsync = null;
  setAsync = null;
} else {
  client = redis.createClient({
    host: cacheConfig.host, // l'adresse du serveur Redis ex localhost
    port: cacheConfig.port, // le port du serveur Redis ex. 6379
    password: cacheConfig.password,
    // si votre serveur Redis nécessite un mot de passe, ajoutez une clé password ici 
    socket: {
      host: cacheConfig.host, // l'adresse du serveur Redis ex localhost
      port: cacheConfig.port, // le port du serveur Redis ex. 6379  
    }
  }
  );

  function connectionEstablished() {
    logger.info('Connected to Redis at ' + cacheConfig.host + ':' + cacheConfig.port);
  }

  function errorThrowing(err) {
    logger.error('Redis Client Error For the Gateway at ' + cacheConfig.host + ':' + cacheConfig.port, err);
  }

  client.on('error', errorThrowing);
  client.on('connect', connectionEstablished) ;
  promiseClient = () => client.connect() ;
  getAsync      = promisify(client.get).bind(client);
  setAsync      = promisify(client.set).bind(client);
}
const cache = { client, getAsync, setAsync, promiseClient }
export { cache };
