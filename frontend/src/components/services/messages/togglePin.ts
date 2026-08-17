import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from '../config';

export default async (
    chatId: string,
    action: 'pin' | 'unpin'
): Promise<{ isSuccess: boolean; chat: any }> => {
    try {
        const token: string = getAccessToken();

        if (!token) {
            throw new Error('Not auth');
        }

        const res = await fetch(configureUrl(`chats/${action}/${chatId}`), {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        return { isSuccess: res.status < 300, chat: data || {} };
    } catch (error) {
        console.log(error);

        return { isSuccess: false, chat: {} };
    }
};
