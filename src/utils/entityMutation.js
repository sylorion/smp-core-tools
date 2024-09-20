// utils/entityBuilder.js
// const { P } = require('pino');
// const { slugify } = require('slugify');
import { v4 as uuid } from 'uuid';
import slugify from 'slugify';
import {appendLoggingContext} from './entityLoader.js'
import { SMPError, UserInputDataValidationError } from '../utils/SMPError.js'

function slug(from) {
    return slugify(from, {
        replacement: '-',  // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match this regex, let to the defaults `undefined`
        lower: true,      // convert to lower case, defaults to `false`
        strict: false,     // strip special characters except replacement, defaults to `false`
        locale: 'en',      // language code of the locale to use
        trim: true         // trim leading and trailing replacement chars, defaults to `true`
    })
}
/**
 * Helper to create an entity with a given entity managing description and an app context.
 * @param {EntityManagingDescription} entityContext - The given parameter from the query client
 * @param {Any} inputs - The actual inputs to consider for the described entity
 * @param {GraphQLContextType} appContext - The GraphQL context of the current query
 * @return {AnyEntity|Error} - The created entity that conforms to the model or an error
 */
async function entityCreator(entityContext, inputs, appContext) {
  if (!entityContext || typeof entityContext !== 'object') {
    throw new SMPError(`Invalid entity context provided`, 'ERROR_INVALID_ENTITY_CONTEXT');
  }
  if (!inputs || typeof inputs !== 'object') {
    throw new UserInputDataValidationError(
      `Need valid inputs data for ${entityContext.entityName}`, 
      entityContext.errorCodeMissingInputs || 'ERROR_MISSING_INPUTS'
    );
  }
  if (!appContext || typeof appContext.logger !== 'object') {
    throw new SMPError(`Invalid app context provided`, 'ERROR_INVALID_APP_CONTEXT');
  }
  let newEntity = undefined;
  let mEntity = undefined;
  const dbOptions = appendLoggingContext({}, appContext);
    // Check if entity existence needs to be managed
    if (entityContext.checkEntityExistanceFn) {
      mEntity = await entityContext.checkEntityExistanceCheckFn(inputs);
      if (mEntity) {
        if (entityContext.checkEntityExistsTreatmentFn) {
          await entityContext.checkEntityExistsTreatmentFn(mEntity, inputs);
        }
      }
    } else {
      mEntity = {};  // Fallback case where no existence function is provided
    }
    // Invoke custom entity creation logic, if provided
    if (entityContext.creatorCheckCallBackFn) {
      newEntity = entityContext.creatorCheckCallBackFn(inputs);
      if (!newEntity) {
        throw new SMPError(`Entity creation callback failed for ${entityContext.entityName}`, 'ERROR_CREATION_CALLBACK_FAILED');
      }
    } else {
      newEntity = {};  // Default empty entity
    }
    // Assign UUID-based unique reference to the entity
    if(!newEntity.uniqRef){
      newEntity.uniqRef = uuid();
    }
    // Handle slug generation based on entityContext options
    if (!newEntity.slug && entityContext.slugAggregateUUIDLeft) {
      newEntity.slug = newEntity.uniqRef + (newEntity.slug ?? "");
    }
    if (!newEntity.slug && entityContext.slugAggregateUUIDRight) {
      newEntity.slug = (newEntity.slug ?? "") + newEntity.uniqRef;
    }
    appContext.logger.info(`Ready to create ${entityContext.entityName} with data: ${JSON.stringify(newEntity)}`);
    // Commit the new entity to the database
    const entity = await entityContext.creatorCommitCallBackFn(newEntity, dbOptions);
    if (!entity) {
      throw new SMPError(`Failed to create ${entityContext.entityName}`, entityContext.errorCodeEntityCreationFaillure || 'ERROR_ENTITY_CREATION_FAILED');
    }
    // Publish entity if a publisher function is available
    if (entityContext.entityPublisherFn) {
      await entityContext.entityPublisherFn(appContext, entityContext, entity);
    }
    appContext.logger.info(`Created ${entityContext.entityName} with data: ${JSON.stringify(entity)}`);
    // Invalidate and set cache if cache management functions exist
    try {
    if (entityContext.entityCacheSetFn) {
      let cacheEntryKey = entityContext.entityCacheKey || (entityContext.entityCacheKeyFn && entityContext.entityCacheKeyFn(entity));
      if (cacheEntryKey) {
        await entityContext.entityCacheSetFn(cacheEntryKey, entityContext.entityCacheValue);
      }
    }
    return entity;
  } catch (error) {
    appContext.logger.error(`Error in entity creation for ${entityContext.entityName}: ${error.message}`, { error });
    if (error instanceof SMPError) {
      throw error;  // Re-throw known SMPError with proper context
    }
    throw new SMPError(`Failed to create ${entityContext.entityName} due to: ${error.message}`, entityContext.errorCodeEntityCreationFaillure || 'ERROR_ENTITY_CREATION_GENERIC');
  }
}

/**
 * Helper to update entity with a given entity managing description and a app context
 * @param {EntityManagingDescription} entityContext - The given parameter from the query client
 * @param {Any} inputs - The actual inputs to consider for the describted entity
 * @param {GraphQLContextType} appContext - the graphQL context of the current query
 * @return {AnyEntity|Error} - The updated entity with correct update
 */
async function entityUpdater(entityContext, inputs, appContext) {
    if (!inputs) {
        throw new UserInputDataValidationError(`Need new inputs data for ${entityContext.entityName}`, entityContext.errorCodeMissingInputs);
    }
    let newEntity = undefined
    let mEntity = undefined
    const dbOptions = appendLoggingContext({}, appContext)
    try {
        mEntity = await (entityContext.entityModel).findByPk(entityContext.entityID, dbOptions)
        if (mEntity) {
            newEntity = (entityContext.updaterCallBackFn)(mEntity, inputs);
            if (newEntity.msgErr) {
                throw new UserInputDataValidationError(`Processing inputs error for ${entityContext.entityName} update : ${newEntity.msgErr}`, entityContext.errorCodeInvalidInputs);
            }
        } else {
            // Cannot happen due to error throwing if not found
            throw new SMPError(`Unable to find the ${entityContext.entityName} id ${entityContext.entityID}: ${error}`, entityContext.errorCodeEntityNotFound);
        }
    } catch (error) {
        appContext.logger.error(error);
        throw new SMPError(`Unable to find the ${entityContext.entityName} id ${entityContext.entityID}: ${error}`, entityContext.errorCodeEntityNotFound);
    }
    try {
      const entity = await (entityContext.updaterCommitCallBackFn)(newEntity, dbOptions);
      if (entity) {
        if (entityContext.entityPublisherFn) {
          await (entityContext.entityPublisherFn)(appContext, entityContext, entity);
        }
            appContext.logger.info(`Updated ${entityContext.entityName}  ${entityContext.entityID} with : ${newEntity}`);
        } else {
            // Should not happen du to throwing error on update faillure
            throw new SMPError(`Enable to update ${entityContext.entityName}  ${entityContext.entityID} cause : ${error}`, entityContext.errorCodeEntityUpdateFaillure);
        }
        // TODO Manage invalidate cache and others before returning 
        if (entityContext.entityCacheManagerFn) {
            return entityContext.entityCacheManagerFn(entity, appContext)
        }
        return entity
    } catch (error) {
        appContext.logger.error(error);
        throw new SMPError(`Enable to update ${entityContext.entityName}  ${entityContext.entityID} cause : ${error}`, entityContext.errorCodeEntityUpdateFaillure);
    }
}

export { slug, uuid, entityCreator, entityUpdater } ;
