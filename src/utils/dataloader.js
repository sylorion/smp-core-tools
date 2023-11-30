// src/utils/dataloader.js
// Used for where clause parsing
import DataLoader                    from 'dataloader';
import { Sequelize, DataTypes, Op }  from 'sequelize';

// import { ObjectStatus, MediaType } from 'smp-core-schema'
import{ trace, SpanStatusCode } from '@opentelemetry/api';

function addingLoggingContext(workerOptions, context) {
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
// Fonction utilitaire pour gérer les erreurs lors de chargement de données
function handleError(context, error = "Unexpeted error", field = "", code = -1) {
  context.logger.error(error + ' (code : '+ code +')');
  return { data: [], errors: [{ message: error, field: field, code: code }] };
}


// Fonction générique pour naviguer dans la liste des entités
async function navigateEntityList(context, cb, pagination = {}, sort = {}, filters = []) {
  const span = trace.getTracer('default').startSpan('navigateEntityList');
  try {
    const whereClause = buildWhereClause(filters); 
    const orderClause = buildOrderClause(sort); 
    const { limit: limit, offset: offset } = buildPaginationClause(pagination);
    context.logger.info( "navigateEntityList::LIMIT AND OFFSET CLAUSE : " + offset + " + " + limit);
    const options = {
      offset,
      limit,
      order: orderClause,
      where: whereClause,
      logging: (msg) => context.logger.info(msg)
    }

    const entities = await cb(options)
    if (entities.length > 0) {
      context.logger.info(entities)
      span.setStatus({ code: SpanStatusCode.OK })
      span.end();
      return { data: entities, errors: [] };
    } else {
      const msgErr = 'navigateEntityList:: No listing found.' ; 
      span.setStatus({ code: SpanStatusCode.ERROR, message: msgErr });
      span.end();
      return handleError(context, msgErr);
    }
  } catch (error) {
    const msgErr = "navigateEntityList:: " + error;
    span.setStatus({ code: SpanStatusCode.ERROR, message: msgErr });
    span.end();
    return handleError(context, msgErr);
  }
}


export { 
  buildWhereClause,
  buildOrderClause,
  buildPaginationClause,
  handleError,
  navigateEntityList, addingLoggingContext
}
