import { Comment } from "../../src/index.js";

/**
 * Updates an existing comment in the database by its unique ID using Sequelize model.
 * This function takes an object containing the update data, where the `commentID` is
 * used to locate the comment, and the remaining properties are used to update the comment.
 * If the `commentID` is not provided, the function throws an error. Similarly, if no comment
 * is found with the given `commentID`, an error is thrown. The function then applies the
 * updates and returns the updated comment object.
 *
 * @async
 * @function updateCommentInDatabase
 * @param {Object} updateCommentData - The data used to update the comment. Must include `commentID` 
 *                                   as a property to identify the comment and any other properties
 *                                   that need to be updated.
 * @returns {Promise<Comment>} - The updated comment object, reflecting the changes made.
 * @throws {Error} - Throws an error if no `commentID` is provided, or if no comment is found with 
 *                   the provided `commentID`, or if the update operation fails.
 */
async function updateCommentInDatabase(updateCommentData) {
  const { commentID, ...updateData } = updateCommentData; // Extrait commentID et prépare updateData sans commentID

  // Vérifie que le comment ID soit bien présent
  if (!commentID) {
    throw new Error("No comment ID provided for update.");
  }

  // Recherche la "Comment" par son ID
  const comment = await Comment.findByPk(commentID);
  if (!comment) {
    throw new Error(`Comment not found with ID: ${commentID}`);
  }

  // Met à jour la comment avec les données fournies dans updateData
  const updatedComment = await comment.update(updateData);
  return updatedComment;
}

/**
 * Attempts to save a new comment to the database.
 * First checks if the comment already exists in the database by its unique reference.
 * If the comment is already in the database or creation fails, it retries twice before logging an error.
 * Only the fields present in commentData and corresponding to the model are set during the creation.
 *
 * @async
 * @function saveCommentToDatabase
 * @param {Object} commentData - The data of the comment to save.
 * @returns {Promise<Comment|null>} - The newly created comment object or null if creation fails after retries.
 * @throws {Error} - Throws an error if unable to create the comment after retries.
 */
async function saveCommentToDatabase(commentData) {
  try {
    const existingComment = await Comment.findOne({
      where: { uniqRef: commentData.uniqRef },
    });

    if (existingComment) {
      console.log(`Comment already exists with uniqRef: ${commentData.uniqRef}`);
      return null;
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const newComment = await Comment.create(commentData);
        return newComment;
      } catch (err) {
        console.error(`Attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3)
          throw new Error("Failed to create comment after 3 attempts");
      }
    }
  } catch (error) {
    console.error(`Error in saveCommentToDatabase: ${error.message}`);
    throw error;
  }
}


  /**
 * Attempts to delete a comment from the database using its ID.
 * The function makes up to three attempts in case of failures, such as a comment not found or a deletion error.
 * After three unsuccessful attempts, it logs the error and returns an object describing the failure.
 *
 * @param {number|string} commentID - The unique identifier of the comment to delete.
 * @returns {Promise<Object>} A promise object that, once resolved, returns an object indicating the success or failure of the operation.
 * The return object includes a `success` field that is a boolean indicating whether the deletion was successful,
 * and a `message` field that provides details about the operation or the error occurred.
 */
async function deleteCommentFromDatabase(commentID) {
    let attempts = 0;
  
    while (attempts < 3) {
      try {
        const comment = await Comment.findByPk(commentID);
  
        if (comment) {
          await comment.destroy();
          return { success: true, message: "Comment deleted successfully" };
        } else {
          throw new Error("Comment not found");
        }
      } catch (error) {
        attempts++;
        if (attempts >= 3) {
          console.error(
            `Failed to delete comment with ID ${commentID}: ${error.message}`
          );
          return { success: false, message: error.message };
        }
      }
    }
  }
  
  export {updateCommentInDatabase,deleteCommentFromDatabase,saveCommentToDatabase}