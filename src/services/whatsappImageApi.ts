import axios from "axios";
import { config } from 'dotenv';
config();

const whatsappImageApi = axios.create({
    baseURL: `https://graph.facebook.com/v${process.env.WHATSAPP_API_VERSION}/`,
    timeout: 10000,
    responseType: 'arraybuffer'
});

whatsappImageApi.interceptors.request.use(
    config => {
        const accessToken = process.env.WHATSAPP_USER_ACCESS_TOKEN;
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    error => {
        console.error('Whatsapp Image API Request Error:', error);
        return Promise.reject(error);
    }
);

whatsappImageApi.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            if (error.response.status === 401) {
                console.warn('Unauthorized access to Whatsapp Image API. Token might be expired or invalid.');
            }
        } else if (error.request) {
            console.error('No response received from Whatsapp Image API:', error.request);
        } else {
            console.error('Error setting up Whatsapp Image API request:', error.message);
        }
        return Promise.reject(error);
    }
);

export default whatsappImageApi;