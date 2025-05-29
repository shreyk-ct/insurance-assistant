import { sendMail } from "../email";
import { summarizeDamages } from "../utils";
import { downloadImage } from "./downloadImage";
import { templateMessage } from "./templateMessage";
import { getOpenAIThread, updateOpenAIThreadPolicy } from "../db/threads";
import { createThread, createThreadMessageWithImage, pollThreadResponse, runThread } from "../openai";
import { OpenAIThreadMessageResponse } from "../openai/types";
import { addImage, updateClaimIdInClaimImages } from "../db/claimImages";

export const handleWhatsappMessages = async (
    senderPhoneNumber: string,
    messageId: string,
    messageType: string,
    messages: any
) => {
    if (messageType === 'text') {
        console.log("text message")
        const messageText = messages.text.body;
        await templateMessage(messageText, senderPhoneNumber, false, messageId, false);
    } else if (messageType === 'image') {
        console.log("image message")
        const imageId = messages.image.id;
        await templateMessage("Please allow us time to analyse the image.", senderPhoneNumber, true, "", false);
        const { file: imageData, base64Image } = await downloadImage(imageId);
        if (imageData) {
            let threadId = await getOpenAIThread(senderPhoneNumber);
            let llmResponse: string | undefined;
            if (!threadId) {
                threadId = (await createThread()).id;
            }
            await createThreadMessageWithImage(threadId, "analyze", imageData);
            const runAssistant = await runThread(threadId);
            const threadResponse: OpenAIThreadMessageResponse = await pollThreadResponse(threadId, runAssistant.id);
            llmResponse = threadResponse.text.value;
            let jsonStart = llmResponse!.indexOf("```");
            if (jsonStart !== -1) {
                jsonStart = llmResponse!.indexOf("```json");
                const jsonEnd = llmResponse!.lastIndexOf("```");
                let jsonRespStr = llmResponse!.substring(jsonStart + 7, jsonEnd);
                let jsonResp = JSON.parse(jsonRespStr);
                const damageDetected = jsonResp.damageDetected;
                if (damageDetected) {
                    const damageSummary = summarizeDamages(jsonResp);
                    await templateMessage(damageSummary, senderPhoneNumber, true, messageId, true);
                    await addImage(senderPhoneNumber, base64Image, damageSummary);
                } else {
                    await templateMessage("The image provided is not of a car, please provide a car image with damages.", senderPhoneNumber, true, messageId, false);
                }
            }
        }
    } else if (messageType === 'interactive') {
        const interactiveMessage = messages.interactive;
        if (interactiveMessage.type === 'button_reply') {
            const buttonReply = interactiveMessage.button_reply;
            const buttonId = buttonReply.id;
            if (buttonId === '1') {
                await templateMessage("We will be raising the claim on your behalf. You will receive all the details on your mail as per our records.", senderPhoneNumber, true, messageId, false);
                await sendMail(senderPhoneNumber)
            }
        } else if (interactiveMessage.type === 'list_reply') {
            const listReply = interactiveMessage.list_reply;
            await templateMessage(`Thank you! We will be keeping Policy Number ${listReply.title} in our mind while proceeding. Please let us know your query!`, senderPhoneNumber, true, messageId, false);
            await updateOpenAIThreadPolicy(senderPhoneNumber, listReply.id);
            await updateClaimIdInClaimImages(listReply.id);
        }
    }
}