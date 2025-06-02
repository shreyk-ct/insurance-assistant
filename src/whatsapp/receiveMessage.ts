import { Request, Response } from 'express';
import { handleWhatsappMessages } from '.';
import { getTotalOpenAIThreads } from '../db/threads';

export const verifyWebhook = (req: Request, res: Response) => {
    const hubChallenge = req.query['hub.challenge'];
    const hubVerifyToken = req.query['hub.verify_token'];
    const hubMode = req.query['hub.mode'];

    if (hubMode === 'subscribe' && hubVerifyToken === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(hubChallenge);
    } else {
        res.status(403).send('Error, invalid verification token');
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    const data = req.body;
    try {
        if (data && data.object === 'whatsapp_business_account') {
            for (const entry of data.entry) {
                const webhookEvent = entry.changes[0].value;
                if (webhookEvent) {
                    const messages = webhookEvent.messages?.[0] ?? undefined;
                    if (messages) {
                        const senderPhoneNumber = messages.from;
                        const messageId = messages.id;
                        const messageType = messages.type;

                        handleWhatsappMessages(senderPhoneNumber, messageId, messageType, messages);
                    }
                }
            }
        }
    } catch (error) {
        res.status(500).send('Error handling webhook');
    }
    res.status(200).send('CONTENT_RECEIVED');
};

export const test = async (req: Request, res: Response) => {
    const totalThreads = await getTotalOpenAIThreads();
    res.send(`Total Open AI Threads: ${totalThreads}`);
};