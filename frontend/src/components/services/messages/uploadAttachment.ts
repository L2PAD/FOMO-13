import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from '../config';

export interface UploadedAttachment {
  url: string;
  name?: string;
  type?: string;
  size?: number;
}

const uploadAttachment = async (
  file: File
): Promise<{ isSuccess: boolean; attachment: UploadedAttachment | null }> => {
  try {
    const token: string = getAccessToken();

    if (!token) {
      return { isSuccess: false, attachment: null };
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(configureUrl('messages/upload'), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.status >= 300) {
      return { isSuccess: false, attachment: null };
    }

    const data = await res.json();

    return {
      isSuccess: true,
      attachment: {
        url: data?.url,
        name: data?.name || file.name,
        type: file.type,
        size: file.size,
      },
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, attachment: null };
  }
};

export default uploadAttachment;
