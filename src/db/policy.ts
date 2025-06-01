import connectionPool from ".";
import { config } from "dotenv";
config();

export const getClaimPolicyInfo = async (phoneNumber: string) => {
    const conversationQuery = `
        SELECT * FROM conversation where user_id = (select id from users where phone_number = $1) and active = true;
    `;
    const policyQuery = `
        SELECT * FROM policies WHERE id = $1;
    `;

    try {
        const { rows } = await connectionPool.query(conversationQuery, [phoneNumber]);
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
        update policies set policy_document = $1
    `;
    const fs = require('fs');

    fs.readFile(process.env.POLICY_DOCUMENT_PATH, async (err: any, data: any) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }
        console.log('File content (callback):');
        const values = [data];
        try {
            await connectionPool.query(policyQuery, values);
            return;
        } catch (error) {
            console.error('Error getting user info:', error);
            return Promise.reject(error);
        }
    });
}