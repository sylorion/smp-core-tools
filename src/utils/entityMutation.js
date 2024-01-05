// utils/entityBuilder.js
// const { P } = require('pino');
// const { slugify } = require('slugify');
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import {appendLoggingContext} from '../utils/dataloader.js'
import { SMPError, UserInputDataValidationError } from '../utils/SMPError.js'

import { PubSub } from 'graphql-subscriptions';
const pubsub = new PubSub();
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

function uuid() {
    return uuidv4();
}


/**
 * Helper to create entity with a given entity managing description and a app context
 * @param {EntityManagingDescription} entityContext - The given parameter from the query client
 * @param {Any} inputs - The actual inputs to consider for the describted entity
 * @param {GraphQLContextType} appContext - the graphQL context of the current query
 * @return {AnyEntity|Error} - The created entity with conforms to the model 
 */
async function entityCreator(entityContext, inputs, appContext) {
    if (!inputs) {
        throw new UserInputDataValidationError(`Need inputs data for ${entityContext.entityName}`, entityContext.erroCodeMissingInputs);
    }
    let newEntity = undefined
    let mEntity = undefined
    const dbOptions = appendLoggingContext({}, appContext)

    // Could be managed by the caller before calling this function
    if (entityContext.checkEntityExistanceFn) {
        mEntity = entityContext.checkEntityExistanceFn(inputs)
        if (mEntity) {
            if (entityContext.checkEntityExistTreatmentFn) {
                entityContext.checkEntityExistTreatmentFn(inputs)
            }
        }
    }

    try {
        newEntity = (entityContext.creatorCallBackFn)(mEntity, inputs);
        newEntity.uniqRef = uuid()
        if (entityContext.slugAggregateUUIDLeft) {
            newEntity.slug = newEntity.uniqRef + newEntity.slug ?? ""
        }
        if (entityContext.slugAggregateUUIDRight) {
            newEntity.slug = (newEntity.slug ?? "") + newEntity.uniqRef
        }
        const entity = await (entityContext.entityModel).create(newEntity, dbOptions);
        if (entity) {
            pubsub.publish(entityContext.entityAddTopic, entityContext.entityAddTopicFn(entity));
            appContext.logger.info(`Create ${entityContext.entityName} with : ${entity}`);
        } else {
            // Should not happen du to throwing error on update faillure
            throw new SMPError(`Enable to create ${entityContext.entityName} cause : ${error}`, entityContext.erroCodeEntityCreationFaillure);
        }
        // TODO Manage invalidate cache and others before returning 
        if (entityContext.entityCacheManagerFn) {
            return entityContext.entityCacheManagerFn(entity, appContext)
        }
        return entity
    } catch (error) {
        appContext.logger.error(error);
        throw new SMPError(`Enable to create ${entityContext.entityName} cause : ${error}`, entityContext.erroCodeEntityCreationFaillure);
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
        throw new UserInputDataValidationError(`Need new inputs data for ${entityContext.entityName}`, entityContext.erroCodeMissingInputs);
    }
    let newEntity = undefined
    let mEntity = undefined
    const dbOptions = appendLoggingContext({}, appContext)
    try {
        mEntity = await (entityContext.entityModel).findByPk(entityContext.entityID, dbOptions)
        if (mEntity) {
            newEntity = (entityContext.updaterCallBackFn)(mEntity, inputs);
            if (newEntity.msgErr) {
                throw new UserInputDataValidationError(`Processing inputs error for ${entityContext.entityName} update : ${newEntity.msgErr}`, entityContext.erroCodeInvalidInputs);
            }
        } else {
            // Cannot happen due to error throwing if not found
            throw new SMPError(`Unable to find the ${entityContext.entityName} id ${entityContext.entityID}: ${error}`, entityContext.erroCodeEntityNotFound);
        }
    } catch (error) {
        appContext.logger.error(error);
        throw new SMPError(`Unable to find the ${entityContext.entityName} id ${entityContext.entityID}: ${error}`, entityContext.erroCodeEntityNotFound);
    }
    try {
        const entity = await mEntity.update({ ...newEntity, ...dbOptions });
        if (entity) {
            pubsub.publish(entityContext.entityUpdateTopic, entityContext.entityUpdateTopicFn(entity));
            appContext.logger.info(`Updated ${entityContext.entityName}  ${entityContext.entityID} with : ${newEntity}`);
        } else {
            // Should not happen du to throwing error on update faillure
            throw new SMPError(`Enable to update ${entityContext.entityName}  ${entityContext.entityID} cause : ${error}`, entityContext.erroCodeEntityUpdateFaillure);
        }
        // TODO Manage invalidate cache and others before returning 
        if (entityContext.entityCacheManagerFn) {
            return entityContext.entityCacheManagerFn(entity, appContext)
        }
        return entity
    } catch (error) {
        appContext.logger.error(error);
        throw new SMPError(`Enable to update ${entityContext.entityName}  ${entityContext.entityID} cause : ${error}`, entityContext.erroCodeEntityUpdateFaillure);
    }
}

export { slug, uuid, entityCreator, entityUpdater } ;
