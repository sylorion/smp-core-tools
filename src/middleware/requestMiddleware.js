// src/middleware/requestUUIDMiddleware.js
import { Plugin } from 'graphql-yoga';
import { v4 as uuidv4 } from 'uuid';
// const { trace } = require('@opentelemetry/api');

function useAppAuth(): Plugin {
 return {
  onRequest({ request, fetchAPI, endResponse }) {
    if (!request.headers.get(APP_DEFAULT_X_APP_API_KEY_NAME)) {
      endResponse(
        new fetchAPI.Response(
          null,
          {
            status: 401,
            // headers: {
            //   'x-services-request-id': request.headers.get('x-services-request-id')
            // }
          }
        );
      )
    }
  }
 }
}

function requestUUIDMiddleware(): Plugin {
   return {
    onRequest({ request, fetchAPI, endResponse }) {
      if (!request.headers.get('x-services-request-id')) {
        request.headers.set('x-services-request-id', uuidv4());
      }
    }
  };
}

//
// // Define a custom middleware function to generate and attach the request ID
// const requestUUIDMiddleware = (req, res, next) => {
//
//   res.headers['x-services-request-id'] = req.requestUUIID;
//   next();
// };

module.exports = { requestUUIDMiddleware, useAppAuth };
