/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions on the 'URL' entity within the 'Upload' microservice.
 *
 * The 'document' key represents the exchange name in RabbitMQ under which the events will be published.
 * It maps actions to specific callback functions for the 'URL' entity managed by the 'Upload' microservice.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { consumerConfigDocument } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [entity, actions] of Object.entries(consumerConfigDocument.upload)) {
 *   for (const [action, callbackName] of Object.entries(actions)) {
 *     // Setup consumer for each action
 *     setupConsumer('Upload', 'url', action, callbackName);
 *   }
 * }
 *
 * @property {Object} upload - Represents the 'Upload' microservice, where events related to the 'URL' entity are handled.
 * @property {string} upload.url.processed - Callback function name for processing a URL. Invoked to handle post-upload processing.
 */
const consumerConfigDocument = {
    upload: {
      url: {
        create: "createDocumentFromURL",
      },
    },
  };
  
  export { consumerConfigDocument };
  