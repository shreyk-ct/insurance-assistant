import facebookGraphApi from "../services/facebookGraphApi";

export const replyCustomMessageWithReplyButton = (
    messageText: string,
    messageId: string,
    senderPhoneNumber: string,
) => {
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const messageUrl = `${whatsappPhoneId}/messages`;
    const messageBody = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": senderPhoneNumber,
        "type": "interactive",
        "context": {
            "message_id": messageId,
        },
        "interactive": {
            "type": "button",
            "body": {
                "text": messageText,
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {
                            "id": "1",
                            "title": "Raise Claim",
                        },
                    },
                ],
            },
        },
    };

    try {
        return facebookGraphApi.post(messageUrl, messageBody);
    } catch (error) {
        console.error('Error sending message:', error);
        return Promise.reject(error);
    }
};

export const replyCustomMessage = (
    messageText: string,
    messageId: string,
    senderPhoneNumber: string,
) => {
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const messageUrl = `${whatsappPhoneId}/messages`;
    const messageBody = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": senderPhoneNumber,
        "type": "text",
        "context": {
            "message_id": messageId
        },
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

export const replyCustomMessageWithList = (
    messageText: string,
    messageId: string,
    senderPhoneNumber: string,
    policies: {
        id: string,
        policyNumber: string;
        vehicleMakeModel: string;
        vehicleRegistrationNumber: string;
    }[]
) => {
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const messageUrl = `${whatsappPhoneId}/messages`;
    const messageBody = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": senderPhoneNumber,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "header": {
                "type": "text",
                "text": messageText
            },
            "body": {
                "text": "Select the applicable policy number from the list below:"
            },
            "footer": {
                "text": "Thank You!"
            },
            "action": {
                "button": "Select",
                "sections": [
                    {
                        "title": "Active Policies",
                        "rows": policies.map(policy => ({
                            "id": policy.id,
                            "title": policy.policyNumber,
                            "description": `${policy.vehicleMakeModel} - ${policy.vehicleRegistrationNumber}`
                        }))
                    },
                ]
            }
        }
    };

    try {
        return facebookGraphApi.post(messageUrl, messageBody);
    } catch (error) {
        console.error('Error sending message:', error);
        return Promise.reject(error);
    }
};