import axios from "axios";
import connectionPool from ".";
import { config } from "dotenv";
config();

export const getClaimPolicyInfo = async (phoneNumber: string) => {
    const openAIThreadQuery = `
        SELECT * FROM openai_threads where user_id = (select id from users where phone_number = $1) and active = true;
    `;
    const policyQuery = `
        SELECT * FROM policies WHERE id = $1;
    `;

    try {
        const { rows } = await connectionPool.query(openAIThreadQuery, [phoneNumber]);
        const { rows: policyRows } = await connectionPool.query(policyQuery, [rows[0].policy_id]);
        const policy = policyRows[0];
        return {
            id: policy.id,
            policyNumber: policy.policy_number,
            vehicleMakeModel: policy.vehicle_make_model,
            vehicleRegistrationNumber: policy.vehicle_registration_number,
            vehicleChassisNumber: policy.chassis_number,
            vehicleEngineNumber: policy.engine_number,
            vehicleColor: policy.vehicle_color,
            policyType: policy.policy_type,
            policyProvider: policy.policy_provider,
            coverageAmount: policy.coverage_amount,
        }
    } catch (error) {
        console.error('Error getting user info:', error);
        return Promise.reject(error);
    }
};

export const getPolicyDocument = async (policyId: string) => {
    const policyQuery = `
        SELECT policy_document FROM policies WHERE id = $1;
    `;
    try {
        const { rows } = await connectionPool.query(policyQuery, [policyId]);
        return rows[0].policy_document;
    } catch (error) {
        console.error('Error getting policy document:', error);
        return Promise.reject(error);
    }
}

export const uploadPolicyDocument = async () => {
    const policyQuery = `
        UPDATE policies SET policy_document = $1
    `;

    const policyUrl = process.env.POLICY_DOCUMENT_URL;
    if (!policyUrl) {
        console.error('POLICY_DOCUMENT_URL environment variable not set.');
        return;
    }

    try {
        const response = await axios.get(policyUrl, { responseType: 'arraybuffer' });
        const documentBuffer = Buffer.from(response.data);

        const values = [documentBuffer];
        await connectionPool.query(policyQuery, values);

        console.log('Policy document uploaded successfully.');
    } catch (error) {
        console.error('Error downloading or uploading policy document:', error);
        return Promise.reject(error);
    }
};