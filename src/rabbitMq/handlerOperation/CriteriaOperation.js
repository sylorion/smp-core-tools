import { Criteria } from "../../src/index.js";

/**
 * Updates an existing criteria in the database by its unique ID using Sequelize model.
 * This function requires an object containing the update data, where the `criteriaID` is
 * essential to locate the criteria, and the remaining properties are used to update the criteria.
 * If no criteria is found with the given `criteriaID`, an error is thrown.
 *
 * @async
 * @function updateCriteriaInDatabase
 * @param {Object} updateCriteriaData - The data used to update the criteria. Must include `criteriaID`.
 * @returns {Promise<Criteria>} - The updated criteria object, reflecting the changes made.
 * @throws {Error} - If `criteriaID` is not provided, or if no criteria is found with the provided `criteriaID`.
 */
async function updateCriteriaInDatabase(updateCriteriaData) {
  const { criteriaID, ...updateData } = updateCriteriaData;

  if (!criteriaID) {
    throw new Error("No criteria ID provided for update.");
  }

  const criteria = await Criteria.findByPk(criteriaID);
  if (!criteria) {
    throw new Error(`Criteria not found with ID: ${criteriaID}`);
  }

  return await criteria.update(updateData);
}

/**
 * Attempts to save a new criteria to the database.
 * Checks if the criteria already exists in the database by its unique reference.
 * If the criteria already exists, it returns null; otherwise, it creates the new criteria.
 *
 * @async
 * @function saveCriteriaToDatabase
 * @param {Object} criteriaData - The data of the criteria to save.
 * @returns {Promise<Criteria|null>} - The newly created criteria object or null if it already exists.
 * @throws {Error} - If unable to create the criteria.
 */
async function saveCriteriaToDatabase(criteriaData) {
  const existingCriteria = await Criteria.findOne({ where: { uniqRef: criteriaData.uniqRef } });

  if (existingCriteria) {
    return null; // Return null if criteria already exists
  }

  return await Criteria.create(criteriaData);
}

/**
 * Deletes a criteria from the database using its ID.
 * If the criteria does not exist or the deletion fails, an error is thrown.
 *
 * @param {number|string} criteriaID - The unique identifier of the criteria to delete.
 * @returns {Promise<void>} - Promise that resolves if the criteria is successfully deleted.
 * @throws {Error} - If the criteria is not found or the deletion fails.
 */
async function deleteCriteriaFromDatabase(criteriaID) {
  const criteria = await Criteria.findByPk(criteriaID);

  if (!criteria) {
    throw new Error(`Criteria not found with ID: ${criteriaID}`);
  }

  await criteria.destroy();
}

export { deleteCriteriaFromDatabase, updateCriteriaInDatabase, saveCriteriaToDatabase };
