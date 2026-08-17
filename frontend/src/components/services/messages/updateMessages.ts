import getAccessToken from "../../utils/getAccessToken";
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (chatId: string): Promise<IReturnData> => {
  try {
    const token: string = getAccessToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const responce = await fetch(configureUrl(`messages/${chatId}`), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const message = await responce.json();

    return { success: true, data: message };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
