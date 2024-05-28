import nodemailer from 'nodemailer';

 ; class MailingService {
  sendMail(to, subject, html, options) {
    throw new Error("Cette méthode doit être implémentée par la sous-classe");
  }
}

class MailingServiceFactory {
  static createMailingService() {
    switch (process.env.MAIL_SERVICE) {
      case 'Brevo':
        return new BrevoMailingService();
      default:
        return new SMTPMailingService({
          host: "ssl0.ovh.net",
          port: 587,
          secure: false,
          auth: {
            user: "lgn.yopa@sylorion.com", // Adresse e-mail SMTP
            pass: "LGN@Yopa23",
          },
        });
    }
  }
}

class BrevoMailingService extends MailingService {
  async sendMail(to, subject, html, options) {
    console.log("Envoi via Brevo");
   
  }
}

class SMTPMailingService extends MailingService {
  constructor(smtpConfig) {
    super();
    this.smtpConfig = smtpConfig;
  }

  async sendMail(to, subject, html, options) {
    console.log("Envoi via SMTP", { to, subject });
    const transporter = nodemailer.createTransport(this.smtpConfig);

    const mailOptions = {
      from: this.smtpConfig.auth.user,
      to: to,
      subject: subject,
      html: html,
      ...options
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Mail sent: %s", info.messageId);
    } catch (error) {
      console.error("Failed to send email via SMTP:", error);
      throw error;
    }
  }
}













// // Define async functions to get user and template data
// async function getUserById(userId) {
//   // Simulated database call to get user data
//   try {
//     // Here, you would implement actual database retrieval logic
//     return { id: userId, email: "user@example.com" }; // Simulated user
//   } catch (error) {
//     console.error("Erreur lors de la récupération de l’utilisateur :", error);
//     throw error;
//   }
// }

// async function getNotificationTemplateById(notificationTemplateID) {
//   try {
//     // Here, you would implement actual database retrieval logic for templates
//     return { id: notificationTemplateID, html: "<h1>Welcome!</h1>" }; // Simulated template
//   } catch (error) {
//     console.error("Erreur lors de la récupération du template de notification :", error);
//     throw error;
//   }
// }


export { MailingServiceFactory,MailingService  };

