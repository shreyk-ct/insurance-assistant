import connectionPool from ".";

export const createOpenAIThread = async (phoneNumber: string, threadId: string) => {
    const openAIThreadQuery = `
        INSERT INTO openai_threads (user_id, active, thread_id) VALUES ((select id from users where phone_number = $1), true, $2);
    `;
    const values = [phoneNumber, threadId];
    try {
        await connectionPool.query(openAIThreadQuery, values);
        return true;
    } catch (error) {
        console.error('Open AI Thread call error:', error);
        return Promise.reject(error);
    }
};

export const closeOpenAIThread = async (phoneNumber: string) => {
    const openAIThreadQuery = `
        UPDATE openai_threads SET active = false WHERE user_id = (select id from users where phone_number = $1) and active = true;
    `;
    const values = [phoneNumber];
    try {
        await connectionPool.query(openAIThreadQuery, values);
        return true;
    } catch (error) {
        console.error('Open AI Thread call error:', error);
        return Promise.reject(error);
    }
};

export const updateOpenAIThreadPolicy = async (phoneNumber: string, policyId: string) => {

    const openAIThreadQuery = `
        UPDATE openai_threads SET policy_id = $1 WHERE user_id = (select id from users where phone_number = $2) and active = true;
    `;
    const values = [policyId, phoneNumber];
    try {
        await connectionPool.query(openAIThreadQuery, values);
        return true;
    } catch (error) {
        console.error('Open AI Thread call error:', error);
        return Promise.reject(error);
    }
};

export const getOpenAIThread = async (phoneNumber: string): Promise<string | undefined> => {
    const openAIThreadQuery = `
        SELECT thread_id FROM openai_threads WHERE user_id = (select id from users where phone_number = $1) and active = true;
    `;
    const values = [phoneNumber];
    try {
        const { rows } = await connectionPool.query(openAIThreadQuery, values);
        if (rows[0]) {
            return rows[0].thread_id;
        }
        else undefined;
    } catch (error) {
        console.error('Open AI Thread call error:', error);
        return Promise.reject(error);
    }
};