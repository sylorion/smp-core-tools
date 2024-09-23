// src/middleware/requestUUIDMiddleware.js
import { v4 as uuidv4 } from 'uuid';
// const { trace } = require('@opentelemetry/api');
import { appConfig } from '../../src/configs/env.js'; 
import { appTokens } from '../../src/configs/appTokens.js'; 
import { default as jwt } from 'jsonwebtoken'; 

function useAppAuth(req, res, next) {
  if (!req.getHeader(appConfig.defaultXAppAPIKeyName)) {
    res.status = 401;
    res.headers[appConfig.defaultXAppRequestIDKeyName] = req.headers[appConfig.defaultXAppRequestIDKeyName];
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


// Middleware pour vérifier le token d'application (applicative authentication)
function checkAppToken(req, res, next) {
  const appToken = req.headers[appConfig.defaultXAppRequestIDKeyName];
  if ((!appToken || !appTokens[appToken]) ) {
    if(appConfig.envExc == "prod"){
      return res.status(403).json({ message: 'Forbidden' });
    } else {
      console.error(`======== NO ${appConfig.defaultXAppRequestIDKeyName} FOR APPLICATION DETECTED =========`);
      next();
    }
  } else {
    req.clientAppStaticConfig = appTokens[appToken] ;

    jwt.verify(appToken, appConfig.appJWTSecretSalt, (err, decoded) => {
      if (err && appConfig.envExc == "prod" ) {
        return res.status(401).json({ message: 'Forbidden' });
      }
      // Si le token est valide, vous pouvez ajouter des informations de l'utilisateur à req.user
      req.app = decoded;
      next();
    });
  }
}

// Middleware pour vérifier le token d'utilisateur (user authentication)
function checkUserToken(req, res, next) {
  const userToken = req.headers['authorization'];
  if (!userToken || !userToken.startsWith('Bearer ')) {
    if (appConfig.envExc != "prod") {
      console.error(`======== NO headers[authorization] FOR USER DETECTED =========`);
      console.error("======== NO BEARER FOR USER DETECTED =========");
      next();
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  } else {
    // Extraction et vérification du token JWT from Bearer prefix
    const token = userToken.split(' ')[1];
    jwt.verify(token, appConfig.userJWTSecretSalt, (err, decoded) => {
      if (err && appConfig.envExc == "prod" ) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      // Si le token est valide, vous pouvez ajouter des informations de l'utilisateur à req.user
      req.user = decoded;
      next();
    });
  }
}


function extractBearer(req, res, next){
  const authorizationHeader = req.headers['authorization'];
  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      // Extraction du token sans le préfixe "Bearer "
      const bearerToken = authorizationHeader.substring(7);
      req.bearerToken = bearerToken;
  } else {
      req.bearerToken = null;
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

export { requestUUIDMiddleware, useAppAuth, checkUserToken, checkAppToken};
