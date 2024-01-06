// src/utils/dataloader.js
// Used for where clause parsing
import DataLoader                    from 'dataloader';
import { Sequelize, DataTypes, Op }  from 'sequelize';

// import { ObjectStatus, MediaType } from 'smp-core-schema'
import{ trace, SpanStatusCode } from '@opentelemetry/api';

function appendLoggingContext(workerOptions, context) {
  const additionnalOptions = {logging: (msg) => context.logger.info(msg) } ;
  return {...workerOptions, ...additionnalOptions}
}

/**
 * Format the givent filter format from GraphQL to the Sequelize format
 * @param {*} filter - Filter to control before building the awaiting form in sequelize 
 * @returns {*} - The Sequelize filter format
 */ 
function buildWhereClause(filter) {
  let whereClause = { deletedAt: { [Op.is]: null } };
  filter.forEach(condition => {
    const { field, value, operator } = condition;
    if (!whereClause[field]) whereClause[field] = {};
    switch (operator) {
      case '=':
        whereClause[field] = value;
        break
      case '<':
        whereClause[field] = { [Op.lt]: value };
        break
      case '<=':
        whereClause[field] = { [Op.lte]: value };
        break
      case '>':
        whereClause[field] = { [Op.gt]: value };
        break
      case '>=':
        whereClause[field] = { [Op.gte]: value };
        break;
      //... other cases for other operators
    }
  });
  return whereClause;
}

// Fonction utilitaire pour construire la clause ORDER
function buildOrderClause(sort) {
  // For now we can oly sort on one field -> dans le futur voir comment gérer plusieurs sorting
  let sorting = []
  if (sort.field && sort.order) {
    sorting = [[sort.field, sort.order.toUpperCase()]]; // Adding toUpperCase() to handle case sensitivity in sorting order
  }
  return sorting
}

// Fonction utilitaire pour construire la clause LIMIT et OFFSET
function buildPaginationClause(pagination) {
  const { limit: limit = 10, offset: offset = 0 } = pagination; 
  const ret = {limit: limit, offset: offset};
  return ret;
}

// Fonction générique pour naviguer dans la liste des entités
async function navigateEntityList(context, cb, pagination = {}, sort = {}, filters = []) {
  const span = trace.getTracer('default').startSpan('navigateEntityList');
  try {
    let flts = []
    if (Array.isArray(filters)) {
      flts = filters
    }
    const whereClause = buildWhereClause(flts); 
    const orderClause = buildOrderClause(sort); 
    const { limit: limit, offset: offset } = buildPaginationClause(pagination);
    context.logger.debug( "navigateEntityList::LIMIT AND OFFSET CLAUSE : " + offset + " + " + limit);
    const options = appendLoggingContext({
      offset,
      limit,
      order: orderClause,
      where: whereClause,
    }, context)
    let msgErr
    const entities = await cb(options)
    if (entities.length == 0) { 
      msgErr = 'navigateEntityList:: No listing found.';
      context.logger.error(msgErr); 
    }
    span.setStatus({ code: SpanStatusCode.OK, message: msgErr });
    span.end();
    return entities
  } catch (error) {
    const msgErr = "navigateEntityList:: " + error;
    context.logger.error(msgErr);
    span.setStatus({ code: SpanStatusCode.ERROR, message: msgErr });
    span.end();
    throw new DBaseAccesError('Database Acces Error navigateEntityList:: ', 'DB_ACCES_ERR_002')
  }
}


// Fonction générique pour naviguer dans la liste des entités sans limite
///!\ HARMFULL FUNCTION EXPERT USE ONLY
/// HOW to make this API Private to internal ?
async function unavigableEntityList(context, cb, filters = []) {
  const span = trace.getTracer('default').startSpan('unavigableEntityList');
  const data = navigateEntityList(context, cb, {}, {}, filters)
  span.setStatus({ code: SpanStatusCode.OK })
  span.end();
  return data
}


/**
 * Helper to create entity with a given entity managing description and a app context
 * @param {EntityManagingDescription} entityContext - The given parameter from the query client
 * @param {Any} params - The actual arguments to consider for the describted entity
 * @param {GraphQLContextType} appContext - the graphQL context of the current query
 * @param {GraphQLRequestContext} infos - additionnal informations of the current query
 * @return {[AnyEntity]|Error} - The listed entities in conformance to the model 
 */
async function entityListingByIDs(entityContext, { ids, pagination = {}, sort = {}, filter = [] }, appContext, infos) {
  if (!ids) {
    throw new UserInputDataValidationError(`Need identifiers data for ${entityContext.entityName} ids set retrieval`, entityContext.erroCodeMissingInputs);
  }
  let newEntity = undefined
  let mEntity = undefined
  const dbOptions = appendLoggingContext({}, appContext) 
  // If so let do it generaly
  const idsFilter = {
    field: "profileID",
    value: ids.map(id => parseInt(id)),
    operator: "="
  }
  const resultingArray = entityContext.entityListingTopicFn(parent, { pagination: pagination, sort: sort, filter: [idsFilter, ...filter] }, context, infos)
  return resultingArray
}

export { 
  buildWhereClause,
  buildOrderClause,
  buildPaginationClause,
  unavigableEntityList,
  navigateEntityList, appendLoggingContext,
  entityListingByIDs
}
