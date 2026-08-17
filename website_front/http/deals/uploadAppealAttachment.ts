import getAuthToken from "../getAuthToken";
import { API } from "../../config/api";

export interface UploadAppealAttachmentResponse {
  isSuccess: boolean;
  error?: string;
  url?: string;
  fileName?: string;
}

export const uploadAppealAttachment = async (
  file: File
): Promise<UploadAppealAttachmentResponse> => {
  try {
    const accessToken: string | null = getAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API}/deals/upload-screenshot`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      error: data?.message || "",
      url: data?.url,
      fileName: data?.fileName,
    };
  } catch (error) {
    console.error("Upload appeal attachment error:", error);
    return {
      isSuccess: false,
      error: "Unexpected error while uploading attachment",
    };
  }
};
