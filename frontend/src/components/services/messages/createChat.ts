import getAccessToken from "../../utils/getAccessToken";
import { IReturnData } from '../types';
import { configureUrl } from '../config';

export default async (users: Array<string>): Promise<IReturnData> => {
  try {
    const token: string = getAccessToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const responce = await fetch(configureUrl('chats'), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users }),
      credentials: "include",
    });

    const chat = await responce.json();

    return { success: true, data: chat };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
