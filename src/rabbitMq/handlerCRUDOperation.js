
/**
 * Met à jour une entité dans la base de données.
 * @param {string} entityName - Le nom de l'entité à mettre à jour.
 * @param {Object} updateData - Les données de mise à jour de l'entité.
 * @param {number} entityId - L'identifiant de l'entité à mettre à jour.
 * @returns {Promise<Object>} Une promesse résolue avec l'entité mise à jour.
 * @throws {Error} Une erreur si l'entité n'existe pas ou si aucune ID d'entité n'est fournie.
 */
async function updateEntityInDatabase(entityName, updateData, entityId) {
    // Vérifie si l'ID de l'entité est fournie
    if (!entityId) {
      throw new Error("No entity ID provided for update.");
    }
  
    // Récupère l'entité à mettre à jour par son ID
    const entity = await entityName.findByPk(entityId);
    // Vérifie si l'entité existe
    if (!entity) {
      throw new Error(`Entity not found with ID: ${entityId}`);
    }
  
    // Met à jour l'entité avec les nouvelles données
    const updatedEntity = await entity.update(updateData);
    return updatedEntity;
  }
  
   /**
   * Creates a new entity in the database for the specified entity.
   * @param {string} entityName - The name of the entity for which to create a new instance.
   * @param {Object} entityData - The data of the entity to create.
   * @returns {Promise<Object>} A promise resolved with the newly created entity.
   * @throws {Error} If the model for the entity is not found or if an entity with the same uniqRef already exists.
   */
  async function createEntityInDatabase(entityName, entityData, entityId) {
    if (!entityName) {
      throw new Error("Entity name not provided.");
    }
    if (!entityData) {
      throw new Error("Entity data not provided.");
    }
    if (!entityId) {
      throw new Error("Entity ID not provided.");
    }
    try {
      const existingEntity = await entityName.findByPk(entityId);
      if (existingEntity) {
        console.error("Error: Entity with the same ID already exists.");
        return { success: false, message: "Entity with the same ID already exists." };
     }
     
      const newEntity = await entityName.create(entityData);
      return newEntity;
    } catch (error) {
      console.error("Database operation failed:", error);
      throw new Error(`Failed to create entity due to: ${error.message || "an internal error"}.`);
    }
    
  }
  
  
   /**
   * Supprime une entité de la base de données.
   * @param {string} entityName - Le nom de l'entité à supprimer.
   * @param {number} entityId - L'identifiant de l'entité à supprimer.
   * @returns {Promise<Object>} Une promesse résolue avec un objet indiquant le succès de la suppression.
   * @throws {Error} Une erreur si le modèle d'entité correspondant n'est pas trouvé ou si l'entité n'est pas trouvée.
   */
  async function deleteEntityFromDatabase(entityName, entityId) {
    // Récupère le modèle d'entité correspondant
  
    const entity = await entityName.findByPk(entityId);
  
    // Vérifie si l'entité existe
    if (entity) {
      // Supprime l'entité de la base de données
      await entity.destroy();
  
      return { success: true, message: "Entity deleted successfully" };
    } else {
      return { success: false, message: "Entity not found" };
    }
  }
  
  
  export { updateEntityInDatabase, createEntityInDatabase, deleteEntityFromDatabase };