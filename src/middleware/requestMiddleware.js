// src/middleware/requestUUIDMiddleware.js
import { v4 as uuidv4 } from 'uuid';
// const { trace } = require('@opentelemetry/api');
import { appConfig } from '../../src/configs/env.js'; 
function useAppAuth(req, res, next) {
  if (!req.headers.get(appConfig.defaultXAppAPIKeyName)) {
    res.status = 401;
    res.headers.set(appConfig.defaultXAppRequestIDKeyName, request.headers.get(appConfig.defaultXAppRequestIDKeyName));
    next();
  }
}

function requestUUIDMiddleware(req, res, next) {
  if (!request.headers.get(appConfig.defaultXAppRequestIDKeyName)) {
    request.headers.set(appConfig.defaultXAppRequestIDKeyName, uuidv4());
    res.headers.set(request.headers.get(appConfig.defaultXAppRequestIDKeyName));
  }
}

//
// // Define a custom middleware function to generate and attach the request ID
// const requestUUIDMiddleware = (req, res, next) => {
//
//   res.headers['x-services-request-id'] = req.requestUUIID;
//   next();
// };

export { requestUUIDMiddleware, useAppAuth };
