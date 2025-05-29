import connectionPool from ".";

export const addImage = async (phoneNumber: string, image: string, llmDescription: string): Promise<void> => {

    const conversationQuery = `
        SELECT * FROM conversation where user_id = (select id from users where phone_number = $1) and active = true;
    `;

    const claimQuery = `
        SELECT * FROM insurance_claim WHERE conversation_id = $1
    `;

    const claimImagesQuery = `
        INSERT INTO claim_images (claim_id, image, llm_description) 
        VALUES ($1, $2, $3);
    `;
    const values = [phoneNumber];
    try {
        const { rows } = await connectionPool.query(conversationQuery, values);
        if (!rows[0]) {
            return undefined;
        }
        const { rows: claimRows } = await connectionPool.query(claimQuery, [rows[0].id]);
        await connectionPool.query(claimImagesQuery, [
            claimRows[0]?.id ?? null,
            Buffer.from(image, 'base64'),
            llmDescription
        ]);
        return;
    } catch (error) {
        console.error('Error getting conversation:', error);
        return Promise.reject(error);
    }
};

export const updateClaimIdInClaimImages = async (policyId: string) => {
    const conversationQuery = `
        SELECT id FROM conversation where policy_id = $1 and active = true;
    `;

    const claimQuery = `
        SELECT id FROM insurance_claim WHERE conversation_id = $1
    `;

    const claimImagesQuery = `
        UPDATE claim_images SET claim_id = $1 WHERE claim_id is null;
    `
    try {
        const { rows: conversation } = await connectionPool.query(conversationQuery, [policyId]);
        if (conversation[0]) {
            const { rows: claimRows } = await connectionPool.query(claimQuery, [conversation[0].id]);
            if (claimRows[0]) {
                await connectionPool.query(claimImagesQuery, [claimRows[0].id]);
            }
        }
        return;
    } catch (error) {
        console.error('Error updating claim images:', error);
        return Promise.reject(error);
    }
}

export const getClaimImages = async (claimId: string) => {
    const claimImagesQuery = `
        SELECT * FROM claim_images WHERE claim_id = $1;
    `;
    try {
        const { rows } = await connectionPool.query(claimImagesQuery, [claimId]);
        return rows;
    } catch (error) {
        console.error('Error getting claim images:', error);
        return Promise.reject(error);
    }
}