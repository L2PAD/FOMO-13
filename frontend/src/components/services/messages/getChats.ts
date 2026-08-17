import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from '../config';

export default async (): Promise<{ isSuccess: boolean; chats: Array<any> }> => {
  try {
    const token: string = getAccessToken();

    if (!token) {
      throw new Error('Not auth');
    }

    const res = await fetch(configureUrl('chats'), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, chats: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, chats: [] };
  }
};
