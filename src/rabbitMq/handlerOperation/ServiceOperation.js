import { Service } from "../../src/index.js";

/**
 * Updates an existing service in the database by its unique ID using Sequelize model.
 * This function takes an object containing the update data, where the `serviceID` is
 * used to locate the service, and the remaining properties are used to update the service.
 * If the `serviceID` is not provided, the function throws an error. Similarly, if no service
 * is found with the given `serviceID`, an error is thrown. The function then applies the
 * updates and returns the updated service object.
 *
 * @async
 * @function updateServiceInDatabase
 * @param {Object} updateServiceData - The data used to update the service. Must include `serviceID` 
 *                                   as a property to identify the service and any other properties
 *                                   that need to be updated.
 * @returns {Promise<Service>} - The updated service object, reflecting the changes made.
 * @throws {Error} - Throws an error if no `serviceID` is provided, or if no service is found with 
 *                   the provided `serviceID`, or if the update operation fails.
 */
async function updateServiceInDatabase(updateServiceData) {
  const { serviceID, ...updateData } = updateServiceData; // Extrait serviceID et prépare updateData sans serviceID

  // Vérifie que le service ID soit bien présent
  if (!serviceID) {
    throw new Error("No service ID provided for update.");
  }

  // Recherche la "Service" par son ID
  const service = await Service.findByPk(serviceID);
  if (!service) {
    throw new Error(`Service not found with ID: ${serviceID}`);
  }

  // Met à jour la service avec les données fournies dans updateData
  const updatedService = await service.update(updateData);
  return updatedService;
}

/**
 * Attempts to save a new service to the database.
 * First checks if the service already exists in the database by its unique reference.
 * If the service is already in the database or creation fails, it retries twice before logging an error.
 * Only the fields present in serviceData and corresponding to the model are set during the creation.
 *
 * @async
 * @function saveServiceToDatabase
 * @param {Object} serviceData - The data of the service to save.
 * @returns {Promise<Service|null>} - The newly created service object or null if creation fails after retries.
 * @throws {Error} - Throws an error if unable to create the service after retries.
 */
async function saveServiceToDatabase(serviceData) {
  try {
    const existingService = await Service.findOne({
      where: { uniqRef: serviceData.uniqRef },
    });

    if (existingService) {
      console.log(`Service already exists with uniqRef: ${serviceData.uniqRef}`);
      return null;
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const newService = await Service.create(serviceData);
        return newService;
      } catch (err) {
        console.error(`Attempt ${attempt} failed: ${err.message}`);
        if (attempt === 3)
          throw new Error("Failed to create service after 3 attempts");
      }
    }
  } catch (error) {
    console.error(`Error in saveServiceToDatabase: ${error.message}`);
    throw error;
  }
}

/**
 * Attempts to delete a service from the database using its ID.
 * The function makes up to three attempts in case of failures, such as a service not found or a deletion error.
 * After three unsuccessful attempts, it logs the error and returns an object describing the failure.
 *
 * @param {number|string} serviceID - The unique identifier of the service to delete.
 * @returns {Promise<Object>} A promise object that, once resolved, returns an object indicating the success or failure of the operation.
 * The return object includes a `success` field that is a boolean indicating whether the deletion was successful,
 * and a `message` field that provides details about the operation or the error occurred.
 */
async function deleteServiceFromDatabase(serviceID) {
  let attempts = 0;

  while (attempts < 3) {
    try {
      const service = await Service.findByPk(serviceID);

      if (service) {
        await service.destroy();
        return { success: true, message: "Service deleted successfully" };
      } else {
        throw new Error("Service not found");
      }
    } catch (error) {
      attempts++;
      if (attempts >= 3) {
        console.error(
          `Failed to delete service with ID ${serviceID}: ${error.message}`
        );
        return { success: false, message: error.message };
      }
    }
  }
}

export {deleteServiceFromDatabase,saveServiceToDatabase, updateServiceInDatabase}