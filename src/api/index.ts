import express from 'express';

import { handleWebhook, test, verifyWebhook } from '../whatsapp/receiveMessage';

const router = express.Router();

router.get('/webhook/whatsapp', verifyWebhook);

router.post('/webhook/whatsapp', handleWebhook);

router.get('/test', test);

export default router;
