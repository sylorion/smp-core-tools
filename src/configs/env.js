// src/configs/infraConfig.js
import fs from 'fs';
const secretPath = (new String(process.env.SMP_ROOT_SECRETS_FOLDER ?? '/run/secrets/')).toString();
const databaseUsed = (new String(process.env.SMP_MAIN_DATABASE_USED ?? 'postgresql')).toString();

var env;
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'develop'
|| process.env.NODE_ENV === 'development'
|| process.env.NODE_ENV === 'dev') {
  env = "dev"
} else {
  env = process.env.NODE_ENV
}

const isDevelopmentEnv  = (env === 'dev')
const isProductionEnv   = (env === 'prod')
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

let freezeTableDB='true' 
let hostDB        
let nameDB        
let paranoidDB    
let portDB        
let pswdDB        
let schemaDB      
let syncDB        
let timestampDB   
let usernameDB   
if (databaseUsed) {
  try {
    // freezeTableDB = fs.readFileSync(secretPath + "db_freezed_table_name", 'utf8').trim();
    let db_user_file = (new String(process.env.DATABASE_USER_FILE)).toString();
    let db_host_file = (new String(process.env.DATABASE_HOST_FILE)).toString();
    let db_port_file = (new String(process.env.DATABASE_PORT_FILE)).toString();
    let db_pswd_file = (new String(process.env.DATABASE_PASSWORD_FILE)).toString();
    let db_database_file = (new String(process.env.DATABASE_DB_FILE)).toString();
    let db_timestamp_file = secretPath + "db_timestamp";
    let db_paranoid_file = secretPath + "db_paranoid";
    let db_schema_file = secretPath + "db_schema";
    let db_sync_file = secretPath + "db_sync";

    fs.stat(secretPath, function (err, stat) {
      if (err == null) {
        console.log('Path to secret exists');
        fs.readFileSync(db_user_file, 'utf8', (err, data) => {
          if (!err && data) {
            usernameDB = data.trim()
          } else {
            console.log("Path to file ", db_user_file, " doesn't exists");
          }
        });

        fs.readFileSync(db_host_file, 'utf8', (err, data) => {
          if (!err && data) {
            hostDB = data.trim()
          } else {
            console.log("Path to file ", db_host_file, " doesn't exists");
          }
        });

        fs.readFileSync(db_port_file, 'utf8', (err, data) => {
          if (!err && data) {
            portDB = data.trim()
          } else {
            console.log("Path to file ", db_port_file, " doesn't exists");
          }
        });

        fs.readFileSync(db_pswd_file, 'utf8', (err, data) => {
          if (!err && data) {
            pswdDB = data.trim()
          } else {
            console.log("Path to file ", db_pswd_file, " doesn't exists");
          }
        });

        fs.readFileSync(db_database_file, 'utf8', (err, data) => {
          if (!err && data) {
            nameDB = data.trim()
          } else {
            console.log("Path to file ", db_database_file, " doesn't exists");
          }
        });

        fs.readFileSync(db_timestamp_file, 'utf8', (err, data) => {
          if (!err && data) {
            timestampDB = data.trim()
          } else {
            console.log("Path to file ", db_timestamp_file, " doesn't exists");
          }
        });

        fs.readFileSync(db_paranoid_file, 'utf8', (err, data) => {
          if (!err && data) {
            paranoidDB = data.trim()
          } else {
            console.log("Path to file ", db_paranoid_file, " doesn't exists");
          }
        });

        fs.readFileSync(db_schema_file, 'utf8', (err, data) => {
          if (!err && data) {
            schemaDB = data.trim()
          } else {
            console.log("Path to file ", db_schema_file, " doesn't exists");
          }
        });

        fs.readFileSync(db_sync_file, 'utf8', (err, data) => {
          if (!err && data) {
            syncDB = data.trim()
          } else {
            console.log("Path to file ", db_sync_file, " doesn't exists");
          }
        });

      } else if (err.code === 'ENOENT') {
        // folder does not exist 
        console.log('Secrets folders doesn\'t exist: ', err.code);
        throw new Error(`Error initializing database: ${err}`);
      } else {
        console.log('Something bad happend: ', err.code);
      }
    });
  } catch (error) {
    console.error("Unable to read secret files from the env module : ", secretPath, " doesn't exist.")
    console.error(error)
    console.error("HOPE WE ARE IN DEVELOPMENT ENVIRONMENET")
  }
  
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
  host: process.env.REDIS_HOST  || 'localhost',
  port: parseInt(`${process.env.REDIS_PORT || '6379'}`, 10),
  password: process.env.REDIS_PASSWORD || undefined
}

console.log(cacheConfig)
//
// App Config Object
//
const tagFormationSep = ":"
const serviceFullName = process.env.SMP_MU_SERVICE_NAME ?? "Unkown";
const providedServiceVersion = 'V1';
const providedServiceType = 'API';
const componentName = process.env.SMP_MU_SERVICE_NAME ?? "Unkown"
const componentGroupTrigram   = "smp"
const componentType = "µ-service" // could be a worker, job, batch, deamon, service, and so on
const componentShortName = process.env.SMP_MU_SERVICE_SHORTNAME ?? "unkm"
const serviceFullTag = componentGroupTrigram + tagFormationSep + componentType + tagFormationSep + componentShortName
const requestServerSpelling = serviceFullName + " " + providedServiceType + " " + providedServiceVersion;

const appConfig = {
  envExc: env,
  apiPort: process.env.SMP_MU_SERVICE_API_PORT ?? 4000,
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

const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL,
  exchange: process.env.RABBITMQ_EXCHANGE,
  exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE,
};
export { appConfig, gRPCConfig, dbConfig, cacheConfig, isDevelopmentEnv, isProductionEnv,rabbitMQConfig };
