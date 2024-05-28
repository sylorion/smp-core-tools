import { Role } from "../../src/index.js";

/**
 * Updates an existing role in the database by its unique ID using Sequelize model.
 * This function takes an object containing the update data, where the `roleID` is
 * used to locate the role, and the remaining properties are used to update the role.
 * If the `roleID` is not provided, the function throws an error. Similarly, if no role
 * is found with the given `roleID`, an error is thrown. The function then applies the
 * updates and returns the updated role object.
 *
 * @async
 * @function updateRoleInDatabase
 * @param {Object} updateRoleData - The data used to update the role. Must include `roleID` 
 *                                   as a property to identify the role and any other properties
 *                                   that need to be updated.
 * @returns {Promise<Role>} - The updated role object, reflecting the changes made.
 * @throws {Error} - Throws an error if no `roleID` is provided, or if no role is found with 
 *                   the provided `roleID`, or if the update operation fails.
 */
async function updateRoleInDatabase(updateRoleData) {
  const { roleID, ...updateData } = updateRoleData; // Extrait roleID et prépare updateData sans roleID

  // Vérifie que le role ID soit bien présent
  if (!roleID) {
    throw new Error("No role ID provided for update.");
  }

  // Recherche la "Role" par son ID
  const role = await Role.findByPk(roleID);
  if (!role) {
    throw new Error(`Role not found with ID: ${roleID}`);
  }

  // Met à jour la role avec les données fournies dans updateData
  const updatedRole = await role.update(updateData);
  return updatedRole;
}

/**
 * Attempts to save a new role to the database.
 * First checks if the role already exists in the database by its unique reference.
 * If the role is already in the database or creation fails, it retries twice before logging an error.
 * Only the fields present in roleData and corresponding to the model are set during the creation.
 *
 * @async
 * @function saveRoleToDatabase
 * @param {Object} roleData - The data of the role to save.
 * @returns {Promise<Role|null>} - The newly created role object or null if creation fails after retries.
 * @throws {Error} - Throws an error if unable to create the role after retries.
 */
async function saveRoleToDatabase(roleData) {
  try {
    const existingRole = await Role.findOne({
      where: { uniqRef: roleData.uniqRef },
    });

    if (existingRole) {
      console.log(`Role already exists with uniqRef: ${roleData.uniqRef}`);
      return null;
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const newRole = await Role.create(roleData);
        return newRole;
      } catch (err) {
        console.error(`Attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3)
          throw new Error("Failed to create role after 3 attempts");
      }
    }
  } catch (error) {
    console.error(`Error in saveRoleToDatabase: ${error.message}`);
    throw error;
  }
}

  
  /**
 * Attempts to delete a role from the database using its ID.
 * The function makes up to three attempts in case of failures, such as a role not found or a deletion error.
 * After three unsuccessful attempts, it logs the error and returns an object describing the failure.
 *
 * @param {number|string} roleID - The unique identifier of the role to delete.
 * @returns {Promise<Object>} A promise object that, once resolved, returns an object indicating the success or failure of the operation.
 * The return object includes a `success` field that is a boolean indicating whether the deletion was successful,
 * and a `message` field that provides details about the operation or the error occurred.
 */
async function deleteRoleFromDatabase(roleID) {
    let attempts = 0;
  
    while (attempts < 3) {
      try {
        const role = await Role.findByPk(roleID);
  
        if (role) {
          await role.destroy();
          return { success: true, message: "Role deleted successfully" };
        } else {
          throw new Error("Role not found");
        }
      } catch (error) {
        attempts++;
        if (attempts >= 3) {
          console.error(
            `Failed to delete role with ID ${roleID}: ${error.message}`
          );
          return { success: false, message: error.message };
        }
      }
    }
  }

  export {deleteRoleFromDatabase,saveRoleToDatabase,updateRoleInDatabase}