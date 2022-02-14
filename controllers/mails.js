import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const signupMail = (to, verifyLink) => {
  const msg = {
    to: to,
    from: "team.dev.4chat@gmail.com",
    subject: "Welcome to 4-Chat! - Thanks for joining us ",
    text: "Thank you for signing up",
    html: ` <p>Please confirm your email to start the chat by clicking on the button below.</p>
    <button style="border:none;padding: 10px;border-radius:15px;color:#fbf3e4;background-color:#b91646;font-size:14px;">
    <a style="color:#fbf3e4;text-decoration: none;" href="${verifyLink}">Confirm my email</a></button>`,
  };

  sgMail
    .send(msg)
    .then((response) => {
      console.log(response[0].statusCode);
      console.log(response[0].headers);
    })
    .catch((error) => {
      console.error(error);
    });
};
