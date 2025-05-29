// Create a Nodemailer transporter using Google SMTP
import nodemailer from "nodemailer";

import { config } from 'dotenv';
import { getUserInfo } from "../db/users";
import { getClaimPolicyInfo } from "../db/policy";
import { getClaimInformation } from "../db/insuranceClaim";
import { getClaimImages } from "../db/claimImages";
import { closeOpenAIThread } from "../db/threads";
config();

const getHtmlBody = (phoneNumber: string, email: string, name: string, address: string, policyNumber: string,
    policyProvider: string, vehicleMakeModel: string, vehicleRegistrationNumber: string, vehicleChassisNumber: string,
    vehicleEngineNumber: string, vehicleColor: string, accidentDate: string, accidentTime: string,
    location: string, description: string, policyType: string, coverageAmount: string, vehicleLocation: string, vehicleDamage: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h2 {
      margin-top: 20px;
      color: #2c3e50;
    }
    ul {
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <p>Dear ${policyProvider},</p>

  <p>I am writing to submit an auto insurance claim. Below are the relevant details:</p>

  <h2>Policyholder Details:</h2>
  <p>
    <strong>Full Name:</strong> ${name}<br />
    <strong>Contact Number:</strong> ${phoneNumber}<br />
    <strong>Email Address:</strong> ${email}<br />
    <strong>Address:</strong> ${address}<br />
    <strong>Insurance Policy Number:</strong> ${policyNumber}<br />
    <strong>Insurance Company:</strong> ${policyProvider}
  </p>

  <h2>Vehicle Details:</h2>
  <p>
    <strong>Make and Model:</strong> ${vehicleMakeModel}<br />
    <strong>Registration Number:</strong> ${vehicleRegistrationNumber}<br />
    <strong>Chassis Number:</strong> ${vehicleChassisNumber}<br />
    <strong>Engine Number:</strong> ${vehicleEngineNumber}<br />
    <strong>Color:</strong> ${vehicleColor}
  </p>

  <h2>Accident / Incident Details:</h2>
  <p>
    <strong>Date of Incident:</strong> ${accidentDate}<br />
    <strong>Time of Incident:</strong> ${accidentTime}<br />
    <strong>Location:</strong> ${location}<br />
    <strong>Brief Description of Incident:</strong> ${description}<br />
    <strong>Vehicle Location:</strong> ${vehicleLocation} <br />
    <strong>Vehicle Damage:</strong> ${vehicleDamage}
  </p>

  <h2>Claim Details:</h2>
  <p>
    <strong>Claim Type:</strong> ${policyType}<br />
    <strong>Estimated Damage / Loss:</strong> ${coverageAmount}
  </p>

  <h2>Documents Attached:</h2>
  <ul>
    <li>Photos of Damaged Vehicle</li>
    <li>RC Book</li>
    <li>Driver’s License</li>
    <li>Policy Copy</li>
    <li>Repair Estimate</li>
    <li>FIR/Police Report (if applicable)</li>
    <li>Claim Form</li>
  </ul>

  <p>Please let me know if additional info is needed.</p>

  <p>Thank you.</p>
</body>
</html>

   `

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
    secure: false,
    port: 587,
});

transporter.verify(function (error, success) {
    if (error) {
        console.error('Nodemailer transporter verification failed:', error);
    } else {
        console.log('Nodemailer transporter is ready to send messages');
    }
});


export const sendMail = async (phoneNumber: string) => {

    const userInfo = await getUserInfo(phoneNumber);

    const policyInfo = await getClaimPolicyInfo(phoneNumber);

    const claimInfo = await getClaimInformation(phoneNumber);

    const claimImages = await getClaimImages(claimInfo.id);

    const mailOptions = {
        from: `"${process.env.GMAIL_USER}" <${process.env.GMAIL_USER}>`,
        to: userInfo.email,
        subject: `Auto Insurance Claim - ${userInfo.name}, phone ${phoneNumber}`,
        html: getHtmlBody(phoneNumber, userInfo.email, userInfo.name, userInfo.address, policyInfo.policyNumber, policyInfo.policyProvider,
            policyInfo.vehicleMakeModel, policyInfo.vehicleRegistrationNumber, policyInfo.vehicleChassisNumber,
            policyInfo.vehicleEngineNumber, policyInfo.vehicleColor, claimInfo.date, claimInfo.time, claimInfo.location,
            claimInfo.description, policyInfo.policyType, policyInfo.coverageAmount, claimInfo.vehicleLocation, claimInfo.injuryDamage),
        attachments: claimImages.map((image, index) => ({
            filename: `image${index + 1}.jpg`,
            content: image.image,
            contentType: 'image/jpeg',
        }))
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        await closeOpenAIThread(phoneNumber);
        return { success: true, message: 'Email sent successfully!', messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Failed to send email.', error: error };
    }
};