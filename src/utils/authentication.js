// src/utils/authentication.js
import pkgjwt  from 'jsonwebtoken'; 
import { cache } from '../configs/cache.js';
import { appConfig } from "../configs/env.js"; 
import pkgargon2 from 'argon2'; 
import bcrypt from 'bcryptjs';

export const hashPassword = (password, salt = 12) => bcrypt.hash(password, salt);
export const comparePassword = (password, hashed) => bcrypt.compare(password, hashed);

// import { trace } from '@opentelemetry/api';
const  jwt  = pkgjwt;
const  argon2  = pkgargon2; 
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

// Generate token using JWT 
async function hashTokenWithBCrypt(payload, salt) {
  return await crypt.hahs(payload, salt);
}

// Verify generated token using JWT
async function verifyHaskTokenWithBCrypt(unhashedToken, hashedToken) {
  return await bcrypt.compare(unhashedToken, hashedToken)
}

// Generate token using JWT 
function generateJWTToken(payload, expirationDuration, salt) {
  console.log(`New token to generate with salt: ${salt} expire on ${expirationDuration} seconds`);
  const generatedToken = jwt.sign(payload, salt, {expiresIn: expirationDuration, algorithm: 'HS256'});
  console.log(`*******New generated token : ${generatedToken}\t for ${JSON.stringify(payload)}`);
  const verifResult = jwt.verify(generatedToken, salt);
  console.log(`Token to check with salt: ${salt} ${generatedToken} - ${verifResult.toString()}`);
  return generatedToken;
}

// Verify generated token using JWT
function verifyJWTToken(token, salt) {
  const verifResult = jwt.verify(token, salt);
  console.log(`Token to check with salt: ${salt} ${token} - ${verifResult.toString()}`);
  return verifResult;
}

// Generate token using JWT for user
function generateUserToken(context, user, expirationDuration = appConfig.userRefreshTokenDuration, salt = appConfig.userJWTSecretSalt) {
  // Générer le token JWT
  const userPayload = user.dataValues ?? user; 
  context?.logger?.info(`Payload : ${JSON.stringify(user)}, expiration duration: ${expirationDuration}, salt: ${salt}`);
  const token = generateJWTToken(userPayload, expirationDuration, salt);
  return token;
}

// Generate token using JWT for application
function generateAppToken(context, app, expirationDuration = appConfig.appRefreshTokenDuration, salt = appConfig.appJWTSecretSalt) {
  return generateJWTToken(app, expirationDuration, salt)
}

// Verify generated token using JWT for user
function verifyUserToken(context, userToken, salt = appConfig.userJWTSecretSalt) {
  context?.logger?.info(`User Refresh Token to check : ${userToken}, Salt to use: ${salt}`);
  const verificationResult = verifyJWTToken(userToken, salt);
  context?.logger?.debug(token, "Verify Result For User: ", verificationResult);
  return verificationResult;
}

// Verify generated token using JWT for user
function verifyAppToken(context, appToken, salt = appConfig.appJWTSecretSalt) {
  const verificationResult = verifyJWTToken(appToken, salt);
  context?.logger?.debug(token, "Verify Result For App: ", verificationResult);
  return verificationResult;
}

async function getAppFromToken(context, appToken) {
  let app = await cache.getAsync(appToken);
  if(!app) {
    throw new Error('geyAppFromToken::Error resolving app token api key');
  }
  app.authKey = appToken // little trick to leurre hacker
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

export { generateUserToken, generateAppToken, hashKeyWithArgon, verifyKeyWithArgon, verifyUserToken, verifyAppToken, verifyHaskTokenWithBCrypt, hashTokenWithBCrypt};
