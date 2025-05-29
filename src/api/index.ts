import express from 'express';

import { handleWebhook, verifyWebhook } from '../whatsapp/receiveMessage';

const router = express.Router();

router.get('/webhook/whatsapp', verifyWebhook);

router.post('/webhook/whatsapp', handleWebhook);

export default router;
