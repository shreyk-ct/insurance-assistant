import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const connectionPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: { rejectUnauthorized: false },
});

connectionPool.on('connect', () => {
    console.log('Connected to the PostgreSQL database!');
});

connectionPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default connectionPool;