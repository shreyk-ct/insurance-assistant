import axios from "axios";
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

const facebookGraphApi = axios.create({
    baseURL: `https://graph.facebook.com/v${process.env.WHATSAPP_API_VERSION}/`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

facebookGraphApi.interceptors.request.use(
    config => {
        const accessToken = process.env.WHATSAPP_USER_ACCESS_TOKEN;
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    error => {
        console.error('Facebook Graph API Request Error:', error.data);
        return Promise.reject(error);
    }
);

facebookGraphApi.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            if (error.response.status === 401) {
                console.warn('Unauthorized access to Facebook Graph API. Token might be expired or invalid.');
            }
        } else if (error.request) {
            console.error('No response received from Facebook Graph API:', error.request);
        } else {
            console.error('Response - Error setting up Facebook Graph API request:', error.message);
        }
        return Promise.reject(error);
    }
);

export default facebookGraphApi;