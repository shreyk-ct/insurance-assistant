import connectionPool from ".";
import { ClaimData } from "./types";

export const setClaimInformation = async (phoneNumber: string, data: ClaimData): Promise<void> => {

    const openAIThreadQuery = `
        SELECT * FROM openai_threads where user_id = (select id from users where phone_number = $1) and active = true;
    `;

    const claimQuery = `
        INSERT INTO insurance_claim (accident_date, accident_time, vehicle_location, description, injury_damage, location, openai_thread_id, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;
    const values = [phoneNumber];
    try {
        const { rows } = await connectionPool.query(openAIThreadQuery, values);
        if (!rows[0]) {
            return undefined;
        }
        await connectionPool.query(claimQuery, [
            data.date,
            data.time,
            data.vehicleLocation,
            data.description,
            data.injuryDamage,
            data.location,
            rows[0].id,
            'FILING'
        ]);
        return;
    } catch (error) {
        console.error('Error getting openAIThread:', error);
        return Promise.reject(error);
    }
};

export const getClaimInformation = async (phoneNumber: string) => {
    const openAIThreadQuery = `
        SELECT * FROM openai_threads where user_id = (select id from users where phone_number = $1) and active = true;
    `;

    const claimQuery = `
        SELECT * FROM insurance_claim WHERE openai_thread_id = $1
    `;

    try {
        const { rows } = await connectionPool.query(openAIThreadQuery, [phoneNumber]);
        const { rows: claimRows } = await connectionPool.query(claimQuery, [rows[0].id]);
        return {
            id: claimRows[0].id,
            date: claimRows[0].accident_date,
            time: claimRows[0].accident_time,
            location: claimRows[0].location,
            description: claimRows[0].description,
            injuryDamage: claimRows[0].injury_damage,
            vehicleLocation: claimRows[0].vehicle_location,
        }
    } catch (error) {
        console.error('Error getting user info:', error);
        return Promise.reject(error);
    }
}