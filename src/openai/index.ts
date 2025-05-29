import { config } from 'dotenv';
import OpenAI from "openai";
import { OpenAIThreadMessageResponse } from './types';
config();

let apiKey: string | undefined = process.env.OPENAI_API_KEY;
let assistantId: string | undefined = process.env.ASSISTANT_ID;

const openai = new OpenAI({ apiKey });

export const createThread = async () => {
    return openai.beta.threads.create();
};

export const createThreadMessage = async (threadId: string, message: string) => {
    return openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
    });
};

export const uploadFile = async (file: File) => {
    return openai.files.create({
        file,
        purpose: 'assistants',
    });
};

export const createThreadMessageWithFile = async (threadId: string, message: string, file: File) => {
    const fileId = await uploadFile(file);
    return openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
        attachments: [
            {
                file_id: fileId.id,
                tools: [{ type: 'file_search' }],
            }
        ],
    });
};

export const createThreadMessageWithImage = async (threadId: string, message: string, file: File) => {
    const fileId = await uploadFile(file);
    return openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: [
            {
                type: 'text',
                text: message
            },
            {
                type: 'image_file',
                image_file: {
                    file_id: fileId.id
                }
            }
        ],
    });
};

export const runThread = async (threadId: string) => {
    return openai.beta.threads.runs.create(
        threadId,
        { assistant_id: assistantId! }
    );
};

export const getThreadMessage = async (threadId: string) => {
    return openai.beta.threads.messages.list(threadId);
};

export const pollThreadResponse = async (threadId: string, runId: string): Promise<OpenAIThreadMessageResponse> => {
    let runStatus;
    do {
        await new Promise(resolve => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    } while (runStatus.status !== 'completed');
    const messages = await getThreadMessage(threadId);
    return messages.data[0].content[0] as unknown as OpenAIThreadMessageResponse;
};