import { Organization } from "smp-core-tools";
import { callbacks } from "./index.js";

const µservice = process.env.SMP_MU_SERVICE_NAME; // Nom du microservice stocké dans la variable d'environnement

/**
 * Initializes and starts message consumers for each configured entity and action within the Organization.
 * This function sets up RabbitMQ consumers to listen on specific queues according to the entity and action mappings defined.
 * Each consumer will handle messages by invoking the appropriate callback associated with the action.
 *
 * @async
 * @function startConsumers
 * @description Initializes all necessary RabbitMQ consumers based on the configurations set in Organization.
 * This involves connecting to RabbitMQ, declaring exchanges and queues, binding them with the appropriate routing keys,
 * and setting up listeners that will process incoming messages using predefined callbacks.
 *
 * Usage involves parsing incoming RabbitMQ messages, converting them from their buffer form into JSON,
 * and then processing them using the appropriate callback functions defined in the callbacks object.
 *
 * @returns {Promise<void>} A Promise that resolves when all consumers are set up without any error.
 * @throws {Error} Throws an error if any part of the setup process fails, including connection errors,
 * issues with queue or exchange declaration, binding problems, or errors in message handling.
 *
 * @example
 * startConsumers().then(() => {
 *   console.log("All consumers have been set up and are ready to receive messages.");
 * }).catch(error => {
 *   console.error("Failed to set up consumers:", error);
 * });
 */
async function startConsumers(rabbitMQService) {
  await rabbitMQService.connect();
  // Parcourir chaque entité et action configurée dans Organization
  for (const [exchange, entities] of Object.entries(
    Organization
  )) {
    for (const [entity, actions] of Object.entries(entities)) {
      for (const [action, callbackName] of Object.entries(actions)) {
        const queueName = `${entity}-${action}-${µservice}-queue`;
        const routingKey = `${entity}.${action}`;
        const exchangeName = `${exchange}.events`;
        // Souscrire au topic approprié
        console.log(`Preparing to subscribe to queue ${queueName}...`);
        const callback = callbacks[callbackName];
        await rabbitMQService.subscribeTopic(
          exchangeName,
          routingKey,
          queueName,
          (receivedMsg) => {
            if (callback) {
              try {
                // D'abord, parser le contenu entier du message reçu
                const messageObject = JSON.parse(
                  receivedMsg.content.toString()
                );
                console.log("Full message object:", messageObject); // Afficher pour vérification
                // Ensuite, accéder à la clé 'data' et parser son contenu JSON
                const content = JSON.parse(messageObject.data);

                // console.log("Parsed content from 'data':", content); // Afficher le contenu extrait et parsé
                callback(content);
                console.log(content);
              } catch (error) {
                console.error("Error in callback:", callbackName, error);
              }
            } else {
              console.error("Callback function not found for:", callbackName);
            }
            console.log(
              `Subscribed to queue ${queueName} with routing key ${routingKey} on exchange ${exchangeName}`
            );
          }
        );
      }
    }
  }

  console.log("All consumers have been set up.");
}

export { startConsumers };
