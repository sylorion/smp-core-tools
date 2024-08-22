import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class StripeUtils {
  static async createCustomer(email, name, userId) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId }
      });
      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  static async createStripeCustomer(User, Profile, UserPreferences, userID) {
    try {
      const user = await User.findByPk(userID);
      if (!user) {
        throw new Error("User not found");
      }

      const profile = await Profile.findByPk(user.profileID);
      if (!profile) {
        throw new Error('Profile not found for the user');
      }

      const stripeCustomer = await this.createCustomer(
        user.email,
        `${profile.firstName} ${profile.lastName}`,
        user.id
      );

      const userPreferences = await UserPreferences.findOne({ where: { userID: userID } });
      if (!userPreferences) {
        throw new Error("UserPreferences not found for the user");
      }

      const otherSettings = userPreferences.otherSettings ? JSON.parse(userPreferences.otherSettings) : {};
      otherSettings.stripeCustomerId = stripeCustomer;
      userPreferences.otherSettings = JSON.stringify(otherSettings);

      await userPreferences.save();

      return { stripeCustomerId: stripeCustomer };
    } catch (error) {
      console.error("Error creating Stripe customer or updating UserPreferences:", error);
      throw error;
    }
  }

  static async getOrCreateStripeProduct(service) {
    try {
      const advancedAttributes = service.advancedAttributes ? JSON.parse(service.advancedAttributes) : {};
      let productID = advancedAttributes.stripeProductID;

      if (productID) {
        await stripe.products.update(productID, {
          name: service.title,
          description: service.description,
        });
      } else {
        const product = await stripe.products.create({
          name: service.title,
          description: service.description,
        });
        productID = product.id;
        advancedAttributes.stripeProductID = productID;
        service.advancedAttributes = JSON.stringify(advancedAttributes);
        await service.save();
      }

      return productID;
    } catch (error) {
      console.error('Error creating or updating Stripe product:', error);
      throw error;
    }
  }

  static async createOrUpdateStripePrice(Service, serviceID) {
    try {
      const service = await Service.findByPk(serviceID);
      if (!service) {
        throw new Error('Service not found');
      }

      const productID = await this.getOrCreateStripeProduct(service);

      const priceData = await stripe.prices.create({
        unit_amount: service.price * 100,
        currency: 'usd',
        product: productID,
      });

      const advancedAttributes = service.advancedAttributes ? JSON.parse(service.advancedAttributes) : {};
      advancedAttributes.stripePriceID = priceData.id;
      service.advancedAttributes = JSON.stringify(advancedAttributes);

      await service.save();

      return { stripeProductID: productID, stripePriceID: priceData.id };
    } catch (error) {
      console.error('Error creating or updating Stripe price:', error);
      throw error;
    }
  }

  static async createPaymentIntent(customerID, amount, currency, description) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: currency,
        customer: customerID,
        description: description,
        payment_method_types: ['card'],
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
 * Crée un PaymentIntent pour une estimation donnée.
 *
 * @param {Object} Estimate - Le modèle d'estimation pour accéder aux données.
 * @param {string} invoiceID - L'ID de l'estimation pour laquelle créer le PaymentIntent.
 * @param {string} [customerID=null] - (Optionnel) L'ID du client dans Stripe.
 * @returns {Promise<Object>} - Un objet contenant le client_secret et l'id du PaymentIntent.
 * @throws {Error} - Lance une erreur si l'estimation n'est pas trouvée ou si la création du PaymentIntent échoue.
 */
static async createPaymentIntentForInvoice(Invoice, invoiceID, customerID = null) {
  try {
    console.log("Fetching estimate with ID:", invoiceID);
    const invoice = await Invoice.findByPk(invoiceID);

    if (!invoice) {
      throw new Error('Estimate not found');
    }

    const amount = invoice.totalAmount * 100 //* 1.05; // 5% de frais
    console.log("AMOUNT:", amount);
    console.log("Creating payment intent with amount:", amount, "and customer ID:", customerID);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      // customer: customerID, // Décommenter cette ligne quand le customerID sera mis en place totalemnent
      description: `Payment for estimate ${invoiceID}`,
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'any', // Demande d'authentification 3D Secure
        },
      }
    });

    return { client_secret: paymentIntent.client_secret, paymentIntentID: paymentIntent.id };
  } catch (error) {
    console.error('Error creating payment intent for estimate:', error);
    throw error;
  }
}


/**
   * Check the status of an existing PaymentIntent
   * 
   * @param {string} paymentIntentID - The ID of the PaymentIntent to check
   * @returns {Object} - The PaymentIntent object including the status
   * @throws {Error} - If the PaymentIntent cannot be retrieved or if there is an issue with the request
   */
static async checkPaymentStatus(paymentIntentID) {
  try {
    // Retrieve the existing PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID);

    // Return the PaymentIntent object, allowing the caller to check its status
    return paymentIntent;
  } catch (error) {
    throw new Error(`Failed to retrieve PaymentIntent: ${error.message}`);
  }
}


  static async refundPayment(paymentIntentID) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentID,
      });
      return refund;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }
}

export { StripeUtils };
