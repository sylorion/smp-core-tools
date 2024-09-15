// src/utils/authentication.js
import pkgjwt from 'jsonwebtoken'; 
import { cache } from '../configs/cache.js';
import { appConfig } from "../configs/env.js"; 
import pkgargon2 from 'argon2'; 
import bcrypt from 'bcryptjs';

export const hashPassword = (password, salt = 12) => bcrypt.hash(password, salt);
export const comparePassword = (password, hashed) => bcrypt.compare(password, hashed);

const jwt = pkgjwt;
const argon2 = pkgargon2;

const argonConfig = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,   // 64 MB
  timeCost: 3,           // The amount of computation realized and therefore the execution time
  parallelism: 6         // Number of threads
};

async function hashKeyWithArgon(key) {
  return await argon2.hash(key, argonConfig);
}

async function verifyKeyWithArgon(key, hashKey) {
  return await argon2.verify(hashKey, key);
}

async function hashTokenWithBCrypt(payload, salt) {
  return await bcrypt.hash(payload, salt);
}

async function verifyHashTokenWithBCrypt(unhashedToken, hashedToken) {
  return await bcrypt.compare(unhashedToken, hashedToken);
}

function generateJWTToken(payload, expirationDuration, secret) {
  console.log(`New token to generate with secret: ${secret} expire in ${expirationDuration} seconds`);
  const generatedToken = jwt.sign(payload, secret, { expiresIn: expirationDuration });
  console.log(`*******New generated token: ${generatedToken}\t for ${JSON.stringify(payload)}`);
  return generatedToken;
}

function verifyJWTToken(token, expirationDuration, secret) {
  try {
    const verifResult = jwt.verify(token, secret, { expiresIn: expirationDuration });
    console.log(`Token verified with secret: ${secret} - ${JSON.stringify(verifResult)}`);
    return verifResult;
  } catch (err) {
    console.error(`Token verification failed: ${err.message}`);
    throw err;
  }
}

function generateUserToken(context, user, expirationDuration = appConfig.userRefreshTokenDuration, secret = appConfig.userJWTSecretSalt) {
  const userPayload = user.dataValues ?? user;
  context?.logger?.info(`Payload: ${JSON.stringify(user)}, expiration duration: ${expirationDuration}, secret: ${secret}`);
  return generateJWTToken(userPayload, expirationDuration, secret);
}

function generateAppToken(context, app, expirationDuration = appConfig.appRefreshTokenDuration, secret = appConfig.appJWTSecretSalt) {
  return generateJWTToken(app, expirationDuration, secret);
}

function verifyUserToken(context, userToken, expirationDuration = appConfig.userRefreshTokenDuration, secret = appConfig.userJWTSecretSalt) {
  context?.logger?.info(`User Refresh Token to check: ${userToken}, Secret to use: ${secret}`);
  return verifyJWTToken(userToken, expirationDuration, secret);
}

function verifyAppToken(context, appToken, expirationDuration = appConfig.appRefreshTokenDuration, secret = appConfig.appJWTSecretSalt) {
  return verifyJWTToken(appToken, expirationDuration, secret);
}

async function getAppFromToken(context, appToken) {
  let app = await cache.getAsync(appToken);
  if (!app) {
    throw new Error('getAppFromToken::Error resolving app token api key');
  }
  app.authKey = appToken;
  return app;
}

async function getUserFromToken(context, token) {
  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    context.logger.debug(`getUserFromToken::Payload du JWT décodé: ${JSON.stringify(decodedPayload)}`);
    return decodedPayload;
  } catch (err) {
    context.logger.warning(`getUserFromToken::Erreur lors de la vérification du JWT: ${err.message}`);
    let user = await cache.getAsync(token);
    if (!user) {
      throw new Error('getUserFromToken::User not found in cache');
    }
    return user;
  }
}

export {
  generateUserToken,
  generateAppToken,
  hashKeyWithArgon,
  verifyKeyWithArgon,
  verifyUserToken,
  verifyAppToken,
  verifyHashTokenWithBCrypt,
  hashTokenWithBCrypt
};
