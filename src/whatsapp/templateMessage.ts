import { getUserInfo } from "../db/users";
// import { uploadPolicyDocument } from "../db/policy";
// import { setClaimInformation } from "../db/submitClaim";
import { closeOpenAIThread, createOpenAIThread, getOpenAIThread } from "../db/threads";
import { createThread, createThreadMessage, pollThreadResponse, runThread } from "../openai";
import { replyCustomMessage, replyCustomMessageWithList, replyCustomMessageWithReplyButton } from "./replyMessage";
import { sendCustomMessage } from "./sendCustomMessage";
import { OpenAIThreadMessageResponse } from "../openai/types";
import { setClaimInformation } from "../db/insuranceClaim";
import { uploadPolicyDocument } from "../db/policy";

export const templateMessage = async (
    messageText: string,
    senderPhoneNumber: string,
    directMessage: boolean,
    messageId: string,
    withReplyButton: boolean
) => {
    if (messageText.toLowerCase() === 'upload') {
        await uploadPolicyDocument();
        return;
    }
    if (messageText.toLowerCase() === 'forget') {
        await closeOpenAIThread(senderPhoneNumber);
        return;
    }
    const activeThread: string | undefined = await getOpenAIThread(senderPhoneNumber);
    let sendReplyButton = true;
    if (!activeThread) {
        sendReplyButton = false;
        const threadId = await createThread();
        await createOpenAIThread(senderPhoneNumber, threadId.id);
        await sendCustomMessage("Hello and Welcome to Chimera AI Claims. Please allow us some time until we find your information.", senderPhoneNumber);
        const userInfo = await getUserInfo(senderPhoneNumber);
        if (userInfo.policy.length === 1) {
            return replyCustomMessage(`Hi ${userInfo.name} and your policy number is ${userInfo.policy[0].policyNumber}. How can I assist you today?`, messageId, senderPhoneNumber);
        } else if (userInfo.policy.length > 1) {
            return replyCustomMessageWithList(`Hi ${userInfo.name}!`, messageId, senderPhoneNumber, userInfo.policy);
        } else {
            return sendCustomMessage(`Hello, I couldn't find your information. Please provide your registered phone number.`, senderPhoneNumber);
        }

    }
    if (directMessage) {
        if (messageId && withReplyButton && sendReplyButton) {
            return replyCustomMessageWithReplyButton(messageText, messageId, senderPhoneNumber);
        } else if (messageId) {
            return replyCustomMessage(messageText, messageId, senderPhoneNumber);
        } else {
            return sendCustomMessage(messageText, senderPhoneNumber);
        }
    } else if (messageText.length === 10 && Number.isInteger(Number(messageText))) {
        const userInfo = await getUserInfo("91" + messageText);
        if (userInfo) {
            return replyCustomMessage(`Your name is ${userInfo.name} and your policy number is ${userInfo.policy}. How can I assist you today?`, messageId, senderPhoneNumber);
        }
    } else {
        let llmResponse: string | null;

        await createThreadMessage(activeThread!, messageText);
        const runAssistant = await runThread(activeThread!);
        const threadResponse: OpenAIThreadMessageResponse = await pollThreadResponse(activeThread!, runAssistant.id);
        llmResponse = threadResponse.text.value;
        console.log("message llm response", llmResponse);
        try {
            let jsonStart = llmResponse!.indexOf("```");
            if (jsonStart !== -1) {
                jsonStart = llmResponse!.indexOf("```json") === -1 ? llmResponse!.indexOf("json") : llmResponse!.indexOf("```json");
                const jsonEnd = llmResponse!.lastIndexOf("```");

                let jsonRespStr = llmResponse!.substring(jsonStart + 7, jsonEnd);
                let jsonResp = JSON.parse(jsonRespStr);

                await setClaimInformation(senderPhoneNumber, jsonResp);
                console.log("jsonres", jsonResp);

                const prefix = llmResponse!.substring(0, jsonStart);
                const suffix = llmResponse!.substring(jsonEnd + 3);
                llmResponse = prefix + suffix;
                llmResponse = llmResponse.replace("Here's the information I have collected so far:", "");
            }
        } catch (error) {
            console.error("Error parsing JSON from LLM response:", error);
        }

        return sendCustomMessage(llmResponse!, senderPhoneNumber);
    }
};