import nodemailer from "nodemailer";

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  });
};

export const sendOTP = async (email, otp) => {
  await sendMail({
    to: email,
    subject: "FindIt OTP Verification",
    text: `Your FindIt OTP is ${otp}`,
    html: `<p>Your FindIt OTP is <strong>${otp}</strong>.</p>`
  });

};

export const sendPasswordResetOTP = async (email, otp) => {
  await sendMail({
    to: email,
    subject: "FindIt Password Reset OTP",
    text: `Your FindIt password reset OTP is ${otp}`,
    html: `<p>Your FindIt password reset OTP is <strong>${otp}</strong>.</p>`
  });

};