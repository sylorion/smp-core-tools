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
  
}

export { StripeUtils };