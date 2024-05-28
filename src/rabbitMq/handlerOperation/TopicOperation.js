import { Topic } from "../../src/index.js";

/**
 * Updates an existing topic in the database by its unique ID using Sequelize model.
 * This function takes an object containing the update data, where the `topicID` is
 * used to locate the topic, and the remaining properties are used to update the topic.
 * If the `topicID` is not provided, the function throws an error. Similarly, if no topic
 * is found with the given `topicID`, an error is thrown. The function then applies the
 * updates and returns the updated topic object.
 *
 * @async
 * @function updateTopicInDatabase
 * @param {Object} updateTopicData - The data used to update the topic. Must include `topicID` 
 *                                   as a property to identify the topic and any other properties
 *                                   that need to be updated.
 * @returns {Promise<Topic>} - The updated topic object, reflecting the changes made.
 * @throws {Error} - Throws an error if no `topicID` is provided, or if no topic is found with 
 *                   the provided `topicID`, or if the update operation fails.
 */
async function updateTopicInDatabase(updateTopicData) {
  const { topicID, ...updateData } = updateTopicData; // Extrait topicID et prépare updateData sans topicID

  // Vérifie que le topic ID soit bien présent
  if (!topicID) {
    throw new Error("No topic ID provided for update.");
  }

  // Recherche le "Topic" par son ID
  const topic = await Topic.findByPk(topicID);
  if (!topic) {
    throw new Error(`Topic not found with ID: ${topicID}`);
  }

  // Met à jour la topic avec les données fournies dans updateData
  const updatedTopic = await topic.update(updateData);
  return updatedTopic;
}

/**
 * Attempts to save a new topic to the database.
 * First checks if the topic already exists in the database by its unique reference.
 * If the topic is already in the database or creation fails, it retries twice before logging an error.
 * Only the fields present in topicData and corresponding to the model are set during the creation.
 *
 * @async
 * @function saveTopicToDatabase
 * @param {Object} topicData - The data of the topic to save.
 * @returns {Promise<Topic|null>} - The newly created topic object or null if creation fails after retries.
 * @throws {Error} - Throws an error if unable to create the topic after retries.
 */
async function saveTopicToDatabase(topicData) {
  try {
    const existingTopic = await Topic.findOne({
      where: { uniqRef: topicData.uniqRef },
    });

    if (existingTopic) {
      console.log(`Topic already exists with uniqRef: ${topicData.uniqRef}`);
      return null;
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const newTopic = await Topic.create(topicData);
        return newTopic;
      } catch (err) {
        console.error(`Attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3)
          throw new Error("Failed to create topic after 3 attempts");
      }
    }
  } catch (error) {
    console.error(`Error in saveTopicToDatabase: ${error.message}`);
    throw error;
  }
}
  
  /**
 * Attempts to delete a topic from the database using its ID.
 * The function makes up to three attempts in case of failures, such as a topic not found or a deletion error.
 * After three unsuccessful attempts, it logs the error and returns an object describing the failure.
 *
 * @param {number|string} topicID - The unique identifier of the topic to delete.
 * @returns {Promise<Object>} A promise object that, once resolved, returns an object indicating the success or failure of the operation.
 * The return object includes a `success` field that is a boolean indicating whether the deletion was successful,
 * and a `message` field that provides details about the operation or the error occurred.
 */
async function deleteTopicFromDatabase(topicID) {
    let attempts = 0;
  
    while (attempts < 3) {
      try {
        const topic = await Topic.findByPk(topicID);
  
        if (topic) {
          await topic.destroy();
          return { success: true, message: "Topic deleted successfully" };
        } else {
          throw new Error("Topic not found");
        }
      } catch (error) {
        attempts++;
        if (attempts >= 3) {
          console.error(
            `Failed to delete topic with ID ${topicID}: ${error.message}`
          );
          return { success: false, message: error.message };
        }
      }
    }
  }
export {deleteTopicFromDatabase,saveTopicToDatabase,updateTopicInDatabase}  