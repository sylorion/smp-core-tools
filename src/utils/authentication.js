// src/utils/authentication.js
import { Sequelize, DataTypes, Op, Model } from 'sequelize';
import { PubSub }       from 'graphql-subscriptions';
import { v4 as uuidv4 } from 'uuid';
import pkgjwt  from 'jsonwebtoken';
import { db }   from '../configs/db.js';
import { cache } from '../configs/cache.js'; 
import pkgargon2 from 'argon2';
import { Graph } from 'redis';
import { trace } from '@opentelemetry/api';
const  jwt  = pkgjwt;
const  argon2  = pkgargon2;
const  pubsub = new PubSub();
const argonConfig = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,   // 64 MB
  timeCost: 3,           // The amount of computation realized and therefore the execution time
  parallelism: 6         // Number of threads
} ;

async function hashKeyWithArgon(key) {
  const hash = await argon2.hash(key, argonConfig);
  return hash;
}

async function verifyKeyWithArgon(password, hashKey) {
  const verification = await argon2.verify(hashKey, password, argonConfig);
  return verification;
}

async function generateUserToken(context, user, expirationDuration) {
  // Générer le token JWT
  const userPayload = user.dataValues;
  context.logger.debug(userPayload)
  const token = jwt.sign(userPayload, process.env.JWT_SECRET, {expiresIn: expirationDuration});
  context.logger.info(token)
  return token;
}

async function generateAppToken(context, app, expirationDuration) {
  let appKeyHashed
  try {
    // Générer le token JWT
    appKeyHashed = await hashKeyWithArgon(context, app.authKey);
  } catch (err) {
    throw new Error('generateAppToken::Error hashing key');
  }
  // Should be dehashed back
  const appPayload = app ;
  appPayload.authKey = appKeyHashed || app.authKey ;
  const token = jwt.sign(appPayload, process.env.JWT_SECRET, {expiresIn: expirationDuration});
  return token;
}

async function geyAppFromToken(context, appToken) {
  let app = await cache.getAsync(appToken);
  if(!app) {
    throw new Error('geyAppFromToken::Error resolving app token api key');
  }
  app.authKey = appToken // little trick to leurre hcker
  return app;
}

async function getUserFromToken(context, token) {
  // On essaie de recuperer à partir du cache en cas d'echec
  let user ;
  // Utilisez la fonction verify pour vérifier et décoder le JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedPayload) => {
    user = decodedPayload;
    if (err) {
      context.logger.warning('getUserFromToken::Erreur lors de la vérification du JWT :' + err);
      // Gérer les erreurs en conséquence
      // On essaie de recuperer à partir du cache en cas d'echec
      user = cache.getAsync(token);
      if(!user) {
      // TODO-ADU - Ajouter fonctionnalité de déconnexion total sur les plateformes utilisant ce token,
      // Décoder le token puis indiquer dans la table utilisateur que le token est invalide
      }
    } else {
      context.logger.debug('getUserFromToken::Payload du JWT décodé :' + decodedPayload);
      // Le JWT est valide, et le payload est accessible dans decodedPayload
      user = decodedPayload;
    }
  });
  return user
}

export { generateUserToken, generateAppToken, hashKeyWithArgon, verifyKeyWithArgon, getUserFromToken, geyAppFromToken };
