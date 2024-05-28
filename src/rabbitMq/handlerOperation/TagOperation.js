import { Tag } from "../../src/index.js";

/**
 * Updates an existing tag in the database by its unique ID using Sequelize model.
 * This function takes an object containing the update data, where the `tagID` is
 * used to locate the tag, and the remaining properties are used to update the tag.
 * If the `tagID` is not provided, the function throws an error. Similarly, if no tag
 * is found with the given `tagID`, an error is thrown. The function then applies the
 * updates and returns the updated tag object.
 *
 * @async
 * @function updateTagInDatabase
 * @param {Object} updateTagData - The data used to update the tag. Must include `tagID` 
 *                                   as a property to identify the tag and any other properties
 *                                   that need to be updated.
 * @returns {Promise<Tag>} - The updated tag object, reflecting the changes made.
 * @throws {Error} - Throws an error if no `tagID` is provided, or if no tag is found with 
 *                   the provided `tagID`, or if the update operation fails.
 */
async function updateTagInDatabase(updateTagData) {
  const { tagID, ...updateData } = updateTagData; // Extrait tagID et prépare updateData sans tagID

  // Vérifie que le tag ID soit bien présent
  if (!tagID) {
    throw new Error("No tag ID provided for update.");
  }

  // Recherche la "Tag" par son ID
  const tag = await Tag.findByPk(tagID);
  if (!tag) {
    throw new Error(`Tag not found with ID: ${tagID}`);
  }

  // Met à jour la tag avec les données fournies dans updateData
  const updatedTag = await tag.update(updateData);
  return updatedTag;
}

/**
 * Attempts to save a new tag to the database.
 * First checks if the tag already exists in the database by its unique reference.
 * If the tag is already in the database or creation fails, it retries twice before logging an error.
 * Only the fields present in tagData and corresponding to the model are set during the creation.
 *
 * @async
 * @function saveTagToDatabase
 * @param {Object} tagData - The data of the tag to save.
 * @returns {Promise<Tag|null>} - The newly created tag object or null if creation fails after retries.
 * @throws {Error} - Throws an error if unable to create the tag after retries.
 */
async function saveTagToDatabase(tagData) {
  try {
    const existingTag = await Tag.findOne({
      where: { uniqRef: tagData.uniqRef },
    });

    if (existingTag) {
      console.log(`Tag already exists with uniqRef: ${tagData.uniqRef}`);
      return null;
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const newTag = await Tag.create(tagData);
        return newTag;
      } catch (err) {
        console.error(`Attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3)
          throw new Error("Failed to create tag after 3 attempts");
      }
    }
  } catch (error) {
    console.error(`Error in saveTagToDatabase: ${error.message}`);
    throw error;
  }
}
  
  /**
 * Attempts to delete a tag from the database using its ID.
 * The function makes up to three attempts in case of failures, such as a tag not found or a deletion error.
 * After three unsuccessful attempts, it logs the error and returns an object describing the failure.
 *
 * @param {number|string} tagID - The unique identifier of the tag to delete.
 * @returns {Promise<Object>} A promise object that, once resolved, returns an object indicating the success or failure of the operation.
 * The return object includes a `success` field that is a boolean indicating whether the deletion was successful,
 * and a `message` field that provides details about the operation or the error occurred.
 */
async function deleteTagFromDatabase(tagID) {
    let attempts = 0;
  
    while (attempts < 3) {
      try {
        const tag = await Tag.findByPk(tagID);
  
        if (tag) {
          await tag.destroy();
          return { success: true, message: "Tag deleted successfully" };
        } else {
          throw new Error("Tag not found");
        }
      } catch (error) {
        attempts++;
        if (attempts >= 3) {
          console.error(
            `Failed to delete tag with ID ${tagID}: ${error.message}`
          );
          return { success: false, message: error.message };
        }
      }
    }
  }
  


  export {saveTagToDatabase,updateTagInDatabase,deleteTagFromDatabase}