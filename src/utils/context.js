// src/utils/context.js 
import { v4 as uuidv4 } from 'uuid';
import { appConfig } from '../configs/env.js';
import { kafka } from '../configs/event.js';
import { db } from '../configs/db.js';
import { cache } from '../configs/cache.js';
import { logger } from '../configs/logger.js';

// This is part of the context as it update both response accordingly to the request
const requestUUIDPlugin = (defaultContext) => { 
    // SMP::Q:: to identifier quickly request queries from job queries and others
  const requestUniversalUniqID = uuidv4();
  if (defaultContext.request) {
    if (defaultContext.request.options) {
      if (!defaultContext.request.options.headers[appConfig.defaultXAppRequestIDKeyName]) {
        defaultContext.request.options.headers[appConfig.defaultXAppRequestIDKeyName] = `SMP::Q::${requestUniversalUniqID}`;
      }
    }
  }

  return { ...defaultContext, requestUUIID: requestUniversalUniqID };
};

function getUserTokenFromHeaders(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split('Bearer ')[1];
  // if (!token) {
  //   throw new Error('getUserTokenFromHeaders::Vous devez être connecté pour effectuer cette action.');
  // }
  console.log("BEARER KEY: ", token)
 return token;
}

function getAppAPIKeyFromHeaders(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split('AppApiKey ')[1];
  // if (!token) {
  //   throw new Error('getAppAPIKeyFromHeaders::Vous devez être connecté pour effectuer cette action.');
  // }
  console.log("API KEY: ", token)
  return token;
}

function authsContext(req) {
  const userBearerToken = getUserTokenFromHeaders(req);
  const appAPIKey = getAppAPIKeyFromHeaders(req);
  return { userBearerToken: userBearerToken, appAPIKey: appAPIKey }
}

function updateContext(defaultContext) {
  const newContext = requestUUIDPlugin(defaultContext);
  const log = logger.child({ requestId: newContext.requestUUIID });
  return {...defaultContext, ...{ db: db, kafka: kafka, logger: log, cache: cache, appConfig: appConfig }, ...authsContext(defaultContext.request) }
}

export {
  updateContext,
  getUserTokenFromHeaders,
  getAppAPIKeyFromHeaders,
}

