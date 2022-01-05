import nodemailer, { SentMessageInfo } from "nodemailer";
import getEnvVar from "./getEnvVar";

const transporter = nodemailer.createTransport({
  host: getEnvVar("EMAIL_HOST"),
  port: +getEnvVar("EMAIL_PORT"),
  auth: {
    user: getEnvVar("EMAIL_USER"),
    pass: getEnvVar("EMAIL_PASS"),
  },
});

type MailConfig = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export const sendMail = async (mail: MailConfig): Promise<SentMessageInfo> => {
  const info = await transporter.sendMail(mail);
  if (process.env.NODE_ENV !== "production") {
    console.log(`Email sent to: ${mail.to}`);
    console.group();
    console.log(`Subject: ${mail.subject}`);
    console.log(`Link: ${nodemailer.getTestMessageUrl(info)}`);
    console.groupEnd();
  }
  return info;
};
