import express from 'express';

import { handleWebhook, test, verifyWebhook } from '../whatsapp/receiveMessage';
import { closeAllOpenAIThreads } from '../db/threads';

const router = express.Router();

router.get('/webhook/whatsapp', verifyWebhook);

router.post('/webhook/whatsapp', handleWebhook);

router.get('/test', test);
router.get('/closeall', closeAllOpenAIThreads);

export default router;
