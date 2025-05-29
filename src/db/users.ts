import connectionPool from ".";

export const getUserInfo = async (phoneNumber: string) => {
    const query = `
        SELECT * FROM users WHERE phone_number = $1;
    `;
    const values = [phoneNumber];
    const policyQuery = `
        SELECT * FROM policies WHERE user_id = $1 and status = 'Active'
    `;

    try {
        const { rows } = await connectionPool.query(query, values);
        const { rows: policyRows } = await connectionPool.query(policyQuery, [rows[0].id]);
        return {
            name: rows[0].full_name,
            policy: policyRows.map(row => ({
                id: row.id,
                policyNumber: row.policy_number,
                vehicleMakeModel: row.vehicle_make_model,
                vehicleRegistrationNumber: row.vehicle_registration_number,
            })),
            email: rows[0].email,
            address: rows[0].address
        };
    } catch (error) {
        console.error('Error getting user info:', error);
        return Promise.reject(error);
    }
};