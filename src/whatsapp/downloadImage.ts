import facebookGraphApi from "../services/facebookGraphApi";
import whatsappImageApi from "../services/whatsappImageApi";

export const getMediaUrl = async (mediaId: string): Promise<string> => {
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const imageUrl = `${mediaId}?phone_number_id=${whatsappPhoneId}`;
    try {
        const response = await facebookGraphApi.get(imageUrl);
        const data = await response.data;
        return data.url;
    } catch (error) {
        console.error('Error downloading image:', error);
        return Promise.reject(error);
    }
};

export const downloadImage = async (mediaId: string): Promise<{ file: File, base64Image: string }> => {
    const imageUrl = await getMediaUrl(mediaId);
    try {
        const response = await whatsappImageApi.get(imageUrl);
        const imageBuffer = Buffer.from(response.data);
        const file = new File([imageBuffer], `image.${mediaId}.jpg`, { type: 'image/jpeg' });
        const base64Image = imageBuffer.toString('base64');
        return { file, base64Image };
    } catch (error) {
        console.error('Error downloading image:', error);
        return Promise.reject(error);
    }
};