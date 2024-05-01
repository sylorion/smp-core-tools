
// export { costLimitPlugin } from '@escape.tech/graphql-armor-cost-limit';
// export { maxAliasesPlugin } from '@escape.tech/graphql-armor-max-aliases';
// export { maxDepthPlugin } from '@escape.tech/graphql-armor-max-depth';
// export { maxDirectivesPlugin } from '@escape.tech/graphql-armor-max-directives';
// export { maxTokensPlugin } from '@escape.tech/graphql-armor-max-tokens';
// export { createRedisCache } from '@envelop/response-cache-redis';

export { db }           from './src/configs/db.js';
export { cache } from './src/configs/cache.js';
export { RabbitMQService } from './src/configs/event.js'
export {
    updateContext,
    getUserTokenFromHeaders,
    getAppAPIKeyFromHeaders,
} from './src/utils/context.js';
export {
    buildWhereClause,
    buildOrderClause,
    buildPaginationClause, 
    unavigableEntityList,
    navigateEntityList, appendLoggingContext,
    entityListingByIDs, entityByID, entityListing
} from './src/utils/entityLoader.js'

export { appConfig, gRPCConfig, dbConfig, cacheConfig,rabbitMQConfig } from './src/configs/env.js';
export { getRequestLogger, logger } from './src/configs/logger.js';
export { generateUserToken, generateAppToken, 
    hashKeyWithArgon, verifyKeyWithArgon, 
    getUserFromToken, geyAppFromToken,  } from './src/utils/authentication.js';
export { instrumentationsRegistration } from './src/middleware/tracer-provider.js'
export { isDevelopmentEnv, isProductionEnv } from './src/configs/env.js';
export { slug, uuid, entityCreator, entityUpdater } from './src/utils/entityMutation.js'
export {
    SMPError, DBaseAccesError, AuthenticationError,
    ExternalAPIAccesError, InternalAPIAccesError,
    DataValidationError, WorkflowValidationError, UserInputDataValidationError } from './src/utils/SMPError.js'

    //export des configurations des consumers pour chaque microservice
export{ consumerConfigOrganization } from './src/consumerConfig/configOrganization.js'
export {consumerConfigUserSpace} from './src/consumerConfig/configUserSpace.js'
export {consumerConfigNotification} from './src/consumerConfig/configNotification.js'
export {consumerConfigCatalog} from './src/consumerConfig/configCatalog.js'
export {consumerConfigLocation} from './src/consumerConfig/configLocation.js'
export {consumerConfigAudits} from './src/consumerConfig/configAudits.js'
export{ consumerConfigReviewComment } from './src/consumerConfig/configReviewComment.js'
export{consumerConfigAuthentication} from './src/consumerConfig/configAuthentication.js'
export {consumerConfigAccounting} from './src/consumerConfig/configAccounting.js'

