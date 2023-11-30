// src/configs/infraConfig.js
import fs from 'fs';
const secretPath = '/run/secrets/';

var env;
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'develop'
|| process.env.NODE_ENV === 'development'
|| process.env.NODE_ENV === 'dev') {
  env = "dev"
} else {
  env = process.env.NODE_ENV
}

const debug = process.env.NODE_DEBUG || "info"
const instanceSerial = process.env.SMP_MU_SERVICE_INSTANCE_SERIAL || 1
function computeVerbosityLevel(debug) {
  // Verbose level 0 means debug mode is on so give everything we got (silly mode)
  let verboseLevel = 0;
  switch (debug) {
    case 'debug':
      verboseLevel = 1 ;
      break;
    case 'verbose':
      verboseLevel = 2 ;
      break;
    case 'info':
      verboseLevel = 3 ;
      break;
    case 'io', 'http', 'file': 
      verboseLevel = 4 ;
      break;
    case 'warnning', 'warn', 'warning':
      verboseLevel = 5 ;
      break;
    case 'error':
      verboseLevel = 6 ;
      break;
    default:
      verboseLevel = 7;
      break;
  }
}

const gRPCConfig = {
  host: process.env.GRPC_HOST || '0.0.0.0',
  port: parseInt(`${process.env.GRPC_PORT || 50051}`, 10)
}

let freezeTableDB 
let hostDB        
let nameDB        
let paranoidDB    
let portDB        
let pswdDB        
let schemaDB      
let syncDB        
let timestampDB   
let usernameDB    
try {
  freezeTableDB = fs.readFileSync(secretPath + "db_freezed_table_name", 'utf8').trim();
  hostDB = fs.readFileSync(secretPath + "ussp_db_host", 'utf8').trim();
  nameDB = fs.readFileSync(secretPath + "ussp_db_name", 'utf8').trim();
  paranoidDB = fs.readFileSync(secretPath + "db_paranoid", 'utf8').trim();
  portDB = fs.readFileSync(secretPath + "ussp_db_port", 'utf8').trim();
  pswdDB = fs.readFileSync(secretPath + "ussp_db_pswd", 'utf8').trim();
  schemaDB = fs.readFileSync(secretPath + "db_schema", 'utf8').trim();
  syncDB = fs.readFileSync(secretPath + "db_sync", 'utf8').trim();
  timestampDB = fs.readFileSync(secretPath + "db_timestamp", 'utf8').trim();
  usernameDB = fs.readFileSync(secretPath + "ussp_db_username", 'utf8').trim();  
} catch (error) {
  console.error("Unable to read secret files from the env module\nHOPE WE ARE IN DEVELOPMENT ENVIRONMENET")
}

const dbConfig = {
  dialect: 'postgres',
  host: process.env.DB_HOST || (hostDB ?? 'localhost'),
  port: parseInt(`${process.env.DB_PORT || (portDB ?? 5432)}`, 10),
  user: process.env.DB_USERNAME || (usernameDB ?? 'services_bb_uspace_db_u'),
  password: process.env.DB_PASSWORD || (pswdDB ?? 'bb_uspace_db_u_pswd'),
  name: process.env.DB_DATABASE || (nameDB ?? 'services_uspace_db'),
    schema: process.env.DB_SCHEMA || (schemaDB ?? 'public'),
  sync: process.env.DB_SYNC === (syncDB ?? 'true'),
  paranoid: paranoidDB ?? true,
  timestamp: timestampDB ?? true,
  freezeTableName: freezeTableDB ?? true,
  underscored: false
}

//
// Cache System Config Object
//
const cacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(`${process.env.REDIS_PORT || '6379'}`, 10),
  password: process.env.REDIS_PASSWORD || undefined
}

console.log(cacheConfig)
//
// App Config Object
//
const tagFormationSep = "::"
const serviceFullName = 'Services Gateway';
const providedServiceVersion = 'V1';
const providedServiceType = 'API';
const componentName = "Authentication"
const componentGroupTrigram   = "smp"
const componentType = "µ-service" // could be a worker, job, batch, deamon, service, and so on
const componentShortName = "ussp"
const serviceFullTag = componentGroupTrigram + tagFormationSep + componentType + tagFormationSep + componentShortName
const requestServerSpelling = serviceFullName + " " + providedServiceType + " " + providedServiceVersion;

const appConfig = {
  envExc: env,
  apiPort: process.env.SMP_SERVICE_API_PORT ?? 4000,
  verbose: debug,
  version: providedServiceVersion,
  componentType: componentType,
  componentGroup: componentGroupTrigram,
  componentName: componentName,
  componentShortName: componentShortName,
  componentTag: serviceFullTag,
  componentInstanceSerial: instanceSerial,
  verboseLevel: computeVerbosityLevel(debug),
  defaultCurrencyDevice: process.env.APP_DEFAULT_CURRENCY_DEVICE || "EUR",
  defaultXGraphqlServerName: process.env.APP_DEFAULT_X_GRAPHQL_SERVER || requestServerSpelling,
  defaultXAppAPIKeyName: process.env.APP_DEFAULT_X_APP_API_KEY_NAME || 'x-services-app-key',
  defaultXAppRequestIDKeyName: process.env.APP_DEFAULT_X_APP_REQUEST_ID_KEY_NAME || 'x-services-request-id',
}

export { appConfig, gRPCConfig, dbConfig, cacheConfig };
