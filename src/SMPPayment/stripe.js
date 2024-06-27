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
        // Update the product details if needed
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
        unit_amount: service.price * 100, // Stripe expects the price in cents
        currency: 'usd', // Change the currency as needed
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

  static async createStripePrice(amount, currency, productName) {
    const price = await stripe.prices.create({
      unit_amount: amount,
      currency: currency,
      product_data: {
        name: productName,
      },
    }); 
    return price.id;
  }

  static async createPaymentMethod(cardNumber, expMonth, expYear, cvc) {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc,
      },
    });
    return paymentMethod.id; 
  }

  static async createPaymentIntent(token, amount, currency, description) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method: token,
      description: description,
      confirm: true,
    });
    return paymentIntent;
  }

  static async processPayment(token, amount, currency, description) {
    // Create and confirm payment intent
    const paymentIntent = await this.createPaymentIntent(token, amount, currency, description);
    return paymentIntent;
  }

  static async refundPayment(paymentIntentID) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentID,
    });
    return refund;
  }
}

export { StripeUtils };