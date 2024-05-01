/**
 * Configuration object mapping microservices to entities and associated actions.
 * This configuration specifies which callback functions should be triggered for different
 * actions (created, updated, deleted) on entities within the microservices.
 *
 * The 'audits' key represents the exchange name in RabbitMQ under which the events will be published.
 * It maps actions to specific callback functions for all entities across all microservices managed.
 *
 * @type {Object.<string, Object.<string, Object.<string, string>>>}
 *
 * @example
 * // Usage within the startConsumers function to setup consumers based on this configuration
 * import { consumerConfigAudits } from './config';
 *
 * // Iterating over configuration to setup consumers
 * for (const [microservice, entities] of Object.entries(consumerConfigAudits)) {
 *   for (const [entity, actions] of Object.entries(entities)) {
 *     for (const [action, callbackName] of Object.entries(actions)) {
 *       // Setup consumer for each action
 *       setupConsumer(microservice, entity, action, callbackName);
 *     }
 *   }
 * }
 *
 * @property {Object} audits - Manages events related to all entities across all subscribed microservices.
 */
const consumerConfigAudits = {
  location: {
    place: {
      created: "savePlaceToDatabase",
      updated: "updatePlaceInDatabase",
      deleted: "deletePlaceFromDatabase",
    },
  },
  userSpace: {
    profile: {
      created: "saveProfileToDatabase",
      updated: "updateProfileInDatabase",
      deleted: "deleteProfileFromDatabase",
    },
    user_role: {
      created: "saveUserRoleToDatabase",
      updated: "updateUserRoleInDatabase",
      deleted: "deleteUserRoleFromDatabase",
    },
    payment_method: {
      created: "savePaymentMethodToDatabase",
      updated: "updatePaymentMethodInDatabase",
      deleted: "deletePaymentMethodFromDatabase",
    },
    payment_config: {
      created: "savePaymentConfigToDatabase",
      updated: "updatePaymentConfigInDatabase",
      deleted: "deletePaymentConfigFromDatabase",
    },
    role: {
      created: "saveRoleToDatabase",
      updated: "updateRoleInDatabase",
      deleted: "deleteRoleFromDatabase",
    },
    user: {
      created: "saveUserToDatabase",
      updated: "updateUserInDatabase",
      deleted: "deleteUserFromDatabase",
    },
    userPreference: {
      created: "saveUserPreferenceToDatabase",
      updated: "updateUserPreferenceInDatabase",
      deleted: "deleteUserPreferenceFromDatabase",
    },
  },

  organization: {
    organization: {
      created: "saveOrganizationToDatabase",
      updated: "updateOrganizationInDatabase",
      deleted: "deleteOrganizationFromDatabase",
    },
    userOrganization: {
      created: "saveUserOrganizationToDatabase",
      updated: "updateUserOrganizationInDatabase",
      deleted: "deleteUserOrganizationFromDatabase",
    },
    termsAndConditions: {
      created: "saveTermsAndConditionsToDatabase",
      updated: "updateTermsAndConditionsInDatabase",
      deleted: "deleteTermsAndConditionsFromDatabase",
    },
    faqOrganization: {
      created: "saveFaqOrganizationToDatabase",
      updated: "updateFaqOrganizationInDatabase",
      deleted: "deleteFaqOrganizationFromDatabase",
    },
    organizationMedia: {
      created: "saveOrganizationMediaToDatabase",
      updated: "updateOrganizationMediaInDatabase",
      deleted: "deleteOrganizationMediaFromDatabase",
    },
    industry: {
      created: "saveIndustryToDatabase",
      updated: "updateIndustryInDatabase",
      deleted: "deleteIndustryFromDatabase",
    },
    tagOrganization: {
      created: "saveTagOrganizationToDatabase",
      updated: "updateTagOrganizationInDatabase",
      deleted: "deleteTagOrganizationFromDatabase",
    },
    topicOrganization: {
      created: "saveTopicOrganizationToDatabase",
      updated: "updateTopicOrganizationInDatabase",
      deleted: "deleteTopicOrganizationFromDatabase",
    },
  },
  catalog: {
    service: {
      created: "saveServiceToDatabase",
      updated: "updateServiceInDatabase",
      deleted: "deleteServiceFromDatabase",
    },
    criteria: {
      created: "saveCriteriaToDatabase",
      updated: "updateCriteriaInDatabase",
      deleted: "deleteCriteriaFromDatabase",
    },
    asset: {
      created: "saveAssetToDatabase",
      updated: "updateAssetInDatabase",
      deleted: "deleteAssetFromDatabase",
    },
    serviceAsset: {
      created: "saveServiceAssetToDatabase",
      updated: "updateServiceAssetInDatabase",
      deleted: "deleteServiceAssetFromDatabase",
    },
    serviceMedia: {
      created: "saveServiceMediaToDatabase",
      updated: "updateServiceMediaInDatabase",
      deleted: "deleteServiceMediaFromDatabase",
    },
    faqAnswer: {
      created: "saveFaqAnswerToDatabase",
      updated: "updateFaqAnswerInDatabase",
      deleted: "deleteFaqAnswerFromDatabase",
    },
    faqQuestion: {
      created: "saveFaqQuestionToDatabase",
      updated: "updateFaqQuestionInDatabase",
      deleted: "deleteFaqQuestionFromDatabase",
    },
    faqService: {
      created: "saveFaqServiceToDatabase",
      updated: "updateFaqServiceInDatabase",
      deleted: "deleteFaqServiceFromDatabase",
    },
    serviceAttribute: {
      created: "saveServiceAttributeToDatabase",
      updated: "updateServiceAttributeInDatabase",
      deleted: "deleteServiceAttributeFromDatabase",
    },
    topic: {
      created: "saveTopicToDatabase",
      updated: "updateTopicInDatabase",
      deleted: "deleteTopicFromDatabase",
    },
    tag: {
      created: "saveTagToDatabase",
      updated: "updateTagInDatabase",
      deleted: "deleteTagFromDatabase",
    },
  },

  accounting: {
    invoice: {
      created: "saveInvoiceToDatabase",
      updated: "updateInvoiceInDatabase",
      deleted: "deleteInvoiceFromDatabase",
    },
    estimate: {
      created: "saveEstimateToDatabase",
      updated: "updateEstimateInDatabase",
      deleted: "deleteEstimateFromDatabase",
    },
    transaction: {
      created: "saveTransactionToDatabase",
      updated: "updateTransactionInDatabase",
      deleted: "deleteTransactionFromDatabase",
    },
    estimateAsset: {
      created: "saveEstimateAssetToDatabase",
      updated: "updateEstimateAssetInDatabase",
      deleted: "deleteEstimateAssetFromDatabase",
    },
  },

  accounting: {
    invoice: {
      created: "saveInvoiceToDatabase",
      updated: "updateInvoiceInDatabase",
      deleted: "deleteInvoiceFromDatabase",
    },
    estimate: {
      created: "saveEstimateToDatabase",
      updated: "updateEstimateInDatabase",
      deleted: "deleteEstimateFromDatabase",
    },
    transaction: {
      created: "saveTransactionToDatabase",
      updated: "updateTransactionInDatabase",
      deleted: "deleteTransactionFromDatabase",
    },
    estimateAsset: {
      created: "saveEstimateAssetToDatabase",
      updated: "updateEstimateAssetInDatabase",
      deleted: "deleteEstimateAssetFromDatabase",
    },
  },

  notification: {
    notification: {
      created: "saveNotificationToDatabase",
      updated: "updateNotificationInDatabase",
      deleted: "deleteNotificationFromDatabase",
    },
    notificationTemplate: {
      created: "saveNotificationTemplateToDatabase",
      updated: "updateNotificationTemplateInDatabase",
      deleted: "deleteNotificationTemplateFromDatabase",
    },
  },

  reviewComment: {
    comment: {
      created: "saveCommentToDatabase",
      updated: "updateCommentInDatabase",
      deleted: "deleteCommentFromDatabase",
    },
    review: {
      created: "saveReviewToDatabase",
      updated: "updateReviewInDatabase",
      deleted: "deleteRevieweFromDatabase",
    },
  },

  authentication: {
    application: {
      created: "saveApplicationToDatabase",
      updated: "updateApplicationInDatabase",
      deleted: "deleteApplicationFromDatabase",
    },
    applicationToken: {
      created: "saveApplicationTokenToDatabase",
      updated: "updateApplicationTokenInDatabase",
      deleted: "deleteApplicationTokenFromDatabase",
    },

    userToken: {
      created: "saveUserTokenToDatabase",
      updated: "updateUserTokenInDatabase",
      deleted: "deleteUserTokenFromDatabase",
    },
  },
};

export { consumerConfigAudits };
