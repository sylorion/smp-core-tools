/**
 * Configuration object for Subscribed Microservices Events (SMPevents).
 * This object maps each microservice's domain to the entities within that domain,
 * along with the CRUD operations each entity supports. This setup is used to
 * ensure that microservices subscribe only to valid and supported events,
 * enabling a robust, scalable, and error-resistant event-driven architecture.
 *
 * Structure:
 * Each key in the object represents a microservice domain, such as 'location' or 'userSpace'.
 * Each domain contains sub-keys that represent the entities within that domain.
 * Each entity is associated with an array of strings representing the CRUD operations
 * that the entity supports: 'created', 'updated', and 'deleted'.
 *
 * Usage:
 * This configuration is used by a validation function within the RabbitMQ service setup
 * to check if microservices are subscribed to valid events. The validation function
 * ensures that all active subscriptions in `muConsumers` match against the events listed
 * in `SMPevents`.
 *
 * Example:
 * If a microservice subscribes to listen for 'created' and 'deleted' events on 'User'
 * within the 'userSpace' domain, the validation function will confirm this subscription
 * by referencing the `SMPevents` configuration.
 *
 * @type {Object}
 */

const SMPevents = {
  location: {
    Place: {
      operations: ['created', 'updated', 'deleted']
    }
  },
  userSpace: {
    Profile: {
      operations: ['created', 'updated', 'deleted'] 
    },
    UserRole: {
      operations: ['created', 'updated', 'deleted']
    },
    PaymentMethod: {
      operations: ['created', 'updated', 'deleted']
    },
    PaymentConfig: {
      operations: ['created', 'updated', 'deleted']
    },
    Role: {
      operations: ['created', 'updated', 'deleted']
    },
    User: {
      operations: ['created', 'updated', 'deleted']
    },
    UserPreference: {
      operations: ['created', 'updated', 'deleted']
    }
  },
  organization: {
    Organization: {
      operations: ['created', 'updated', 'deleted']
    },
    UserOrganization: {
      operations: ['created', 'updated', 'deleted']
    },
    TermsAndConditions: {
      operations: ['created', 'updated', 'deleted']
    },
    FaqOrganization: {
      operations: ['created', 'updated', 'deleted']
    },
    OrganizationMedia: {
      operations: ['created', 'updated', 'deleted']
    },
    Industry: {
      operations: ['created', 'updated', 'deleted']
    },
    TagOrganization: {
      operations: ['created', 'updated', 'deleted']
    },
    TopicOrganization: {
      operations: ['created', 'updated', 'deleted']
    }
  },
  catalog: {
    Service: {
      operations: ['created', 'updated', 'deleted']
    },
    Criteria: {
      operations: ['created', 'updated', 'deleted']
    },
    Asset: {
      operations: ['created', 'updated', 'deleted']
    },
    ServiceAsset: {
      operations: ['created', 'updated', 'deleted']
    },
    ServiceMedia: {
      operations: ['created', 'updated', 'deleted']
    },
    FaqAnswer: {
      operations: ['created', 'updated', 'deleted']
    },
    FaqQuestion: {
      operations: ['created', 'updated', 'deleted']
    },
    FaqService: {
      operations: ['created', 'updated', 'deleted']
    },
    ServiceAttribute: {
      operations: ['created', 'updated', 'deleted']
    },
    Topic: {
      operations: ['created', 'updated', 'deleted']
    },
    Tag: {
      operations: ['created', 'updated', 'deleted']
    }
  },
  accounting: {
    Invoice: {
      operations: ['created', 'updated', 'deleted']
    },
    Estimate: {
      operations: ['created', 'updated', 'deleted']
    },
    Transaction: {
      operations: ['created', 'updated', 'deleted']
    },
    EstimateAsset: {
      operations: ['created', 'updated', 'deleted']
    }
  },
  notification: {
    Notification: {
      operations: ['created', 'updated', 'deleted']
    },
    NotificationTemplate: {
      operations: ['created', 'updated', 'deleted']
    }
  },
  reviewComment: {
    Comment: {
      operations: ['created', 'updated', 'deleted']
    },
    Review: {
      operations: ['created', 'updated', 'deleted']
    }
  },
  authentication: {
    Application: {
      operations: ['created', 'updated', 'deleted']
    },
    ApplicationToken: {
      operations: ['created', 'updated', 'deleted']
    },
    UserToken: {
      operations: ['created', 'updated', 'deleted']
    },
    ResetPasswordToken: {
      operations: ['created']
    }
  },
  document: {
    Media: {
      operations: ['created', 'updated', 'deleted']
    }
  },
  upload: {
    Application: {
      operations: ['created']
    }
  }
};

export { SMPevents };
