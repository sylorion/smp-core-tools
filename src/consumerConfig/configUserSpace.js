/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on entities within the microservices.
 *
 * The configuration specifies routing of events based on the source microservices, which are
 * 'catalog', 'document', 'organization', and 'accounting'. Each microservice manages specific entities,
 * like 'devis' for 'catalog', 'media' for 'document', 'organization' for 'organization', and 'invoice' for 'accounting'.
 * Actions for each entity are mapped to specific callback functions that handle the corresponding business logic.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { consumerConfigUserSpace } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [microservice, entities] of Object.entries(consumerConfigUserSpace)) {
 *   for (const [entity, actions] of Object.entries(entities)) {
 *     for (const [action, callbackName] of Object.entries(actions)) {
 *       // Setup consumer for each action using the microservice as exchange, and entity as routing key
 *       setupConsumer(microservice, entity, action, callbackName);
 *     }
 *   }
 * }
 *
 * @property {Object} catalog - Manages events for the 'devis' entity within the 'catalog' microservice.
 * @property {Object} document - Manages events for the 'media' entity within the 'Document' microservice.
 * @property {Object} organization - Manages events for the 'organization' entity within the 'Organization' microservice.
 * @property {Object} accounting - Manages events for the 'invoice' entity within the 'Accounting' microservice.
 */
const consumerConfigUserSpace = {
    catalog: {
      devis: {
        created: "saveDevisToDatabase",
        updated: "updateDevisInDatabase",
        deleted: "deleteDevisFromDatabase",
      },
    },
    document: {
      media: {
        created: "saveMediaToDatabase",
        updated: "updateMediaInDatabase",
        deleted: "deleteMediaFromDatabase",
      },
    },
    organization: {
      organization: {
        created: "saveOrganizationToDatabase",
        updated: "updateOrganizationInDatabase",
        deleted: "deleteOrganizationFromDatabase",
      },
    },
    accounting: {
      invoice: {
        created: "saveInvoiceToDatabase",
        updated: "updateInvoiceInDatabase",
        deleted: "deleteInvoiceFromDatabase",
      },
    },
  };
  
  export { consumerConfigUserSpace };
  