import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (
    chatId: string,
    action:'pin' | 'unpin'
): Promise<{ isSuccess: boolean; chat: any }> => {
    try {
        const accessToken: string | null = getAuthToken();

        const res = await fetch(`${API}/chats/${action}/${chatId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await res.json();

        return { isSuccess: res.status < 300, chat: data || {} };
    } catch (error) {
        console.log(error);

        return { isSuccess: false, chat: {} };
    }
};
