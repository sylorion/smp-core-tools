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
  // Handly compute the exp time to avoid a strange bug
  const expTime = new Number(Math.floor((new Date().getTime())/1000) + (new Number(expirationDuration)));
   const generatedToken = jwt.sign({...payload, maxAge: '350d', exp: expTime}, secret, {algorithm: 'HS512'});
  return generatedToken;
}

function verifyJWTToken(token, secret) {
  const verifResult = jwt.verify(token, secret, {algorithm: 'HS512'});
  return verifResult;
}

function generateUserToken(context, user, expirationDuration = appConfig.userRefreshTokenDuration, secret = appConfig.userJWTSecretSalt) {
  const userPayload = user.dataValues ?? user;
  context?.logger?.info(`Payload: ${JSON.stringify(user)}, expiration duration: ${expirationDuration}, Salt Secret: ${secret}`);
  return generateJWTToken(userPayload, expirationDuration, secret);
}

function generateAppToken(context, app, expirationDuration = appConfig.appRefreshTokenDuration, secret = appConfig.appJWTSecretSalt) {
  return generateJWTToken(app, expirationDuration, secret);
}

function verifyUserToken(context, userToken, secret = appConfig.userJWTSecretSalt) {
  context?.logger?.info(`User Refresh Token to check: ${userToken}, Secret to use: ${secret}`);
  return verifyJWTToken(userToken, secret);
}

function verifyAppToken(context, appToken, secret = appConfig.appJWTSecretSalt) {
  return verifyJWTToken(appToken, secret);
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
