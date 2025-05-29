import facebookGraphApi from "../services/facebookGraphApi";

export const sendCustomMessage = (
    messageText: string,
    senderPhoneNumber: string,
) => {
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const messageUrl = `${whatsappPhoneId}/messages`;
    const messageBody = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": senderPhoneNumber,
        "type": "text",
        "text": {
            "preview_url": false,
            "body": messageText
        }
    };

    try {
        return facebookGraphApi.post(messageUrl, messageBody);
    } catch (error) {
        console.error('Error sending message:', error);
        return Promise.reject(error);
    }
};