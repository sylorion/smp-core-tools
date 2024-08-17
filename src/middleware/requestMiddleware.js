// src/middleware/requestUUIDMiddleware.js
import { v4 as uuidv4 } from 'uuid';
// const { trace } = require('@opentelemetry/api');
import { appConfig } from '../../src/configs/env.js'; 
function useAppAuth(req, res, next) {
  if (!req.getHeader(appConfig.defaultXAppAPIKeyName)) {
    res.status = 401;
    res.headers[appConfig.defaultXAppRequestIDKeyName] = request.headers[appConfig.defaultXAppRequestIDKeyName];
  }
  next();
}

function requestUUIDMiddleware(req, res, next) {
  if (!req.headers[appConfig.defaultXAppRequestIDKeyName]) {
    req.headers[appConfig.defaultXAppRequestIDKeyName] = uuidv4();
    res.setHeader(appConfig.defaultXAppRequestIDKeyName, req.headers[appConfig.defaultXAppRequestIDKeyName]);
  }
  next();
}

//
// // Define a custom middleware function to generate and attach the request ID
// const requestUUIDMiddleware = (req, res, next) => {
//
//   res.headers['x-services-request-id'] = req.requestUUIID;
//   next();
// };

export { requestUUIDMiddleware, useAppAuth };
