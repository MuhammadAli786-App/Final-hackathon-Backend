import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export const sendEmail = async ({ to, subject, templateName, variables }) => {
  // Read HTML template
  let html = fs.readFileSync(
    path.join(process.cwd(), "templates", templateName),
    "utf-8"
  );

  // Replace placeholders like ${name}, ${OTP} dynamically
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, "g");
    html = html.replace(regex, variables[key]);
  });

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    html,
  });
};

// import nodemailer from "nodemailer";
// import fs from "fs";
// import path from "path";

// // ✅ Create transporter once (not every time)
// const transporter = nodemailer.createTransport({
//   service: "Gmail",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.APP_PASSWORD,
//   },
// });

// // ✅ Reusable sendEmail function
// export const sendEmail = async ({
//   to,
//   subject,
//   templateName,
//   variables = {},
// }) => {
//   try {
//     // Read template safely
//     const templatePath = path.join(process.cwd(), "templates", templateName);

//     let html = fs.readFileSync(templatePath, "utf-8");

//     // Replace placeholders
//     Object.keys(variables).forEach((key) => {
//       const regex = new RegExp(`\\$\\{${key}\\}`, "g");
//       html = html.replace(regex, variables[key]);
//     });

//     await transporter.sendMail({
//       from: `"Watch Store" <${process.env.EMAIL}>`,
//       to,
//       subject,
//       html,
//     });

//     console.log("Email sent successfully ✅");
//   } catch (error) {
//     console.error("Email sending failed ❌", error.message);
//     throw new Error("Email could not be sent");
//   }
// };
