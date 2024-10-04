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
    username: cacheConfig.username,
    socket: {
      host: cacheConfig.host, // l'adresse du serveur Redis ex localhost
      port: cacheConfig.port, // le port du serveur Redis ex. 6379  
      reconnectStrategy: function(retries) {
        if (retries > 20) {
          console.log("Too many attempts to reconnect. Redis connection was terminated");
          return new Error("Too many retries.");
        } else {
          return retries * 500;
        }
    }
  }
  }
  );

  function connectionEstablished() {
    logger.info('Connected to Redis at ' + cacheConfig.host + ':' + cacheConfig.port);
  }

  function errorThrowing(err) {
    logger.error('Redis Client Error at ' + cacheConfig.host + ':' + cacheConfig.port, err);
  }

  client.on('error', errorThrowing);
  client.on('connect', connectionEstablished) ;
  const promiseClient = async () => client.connect() ;
  const getAsync      = promisify(client.get).bind(client);
  const setAsync      = promisify(client.set).bind(client);
}
const cache = { client, getAsync, setAsync, promiseClient }
export { cache };
