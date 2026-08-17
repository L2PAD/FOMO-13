import { API } from "../../config/api";
import { ChangePasswordType } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  passwords: ChangePasswordType
): Promise<{ isSuccess: boolean; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/user/new/password`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(passwords),
    });

    const data = await res.json();

    return { isSuccess: !data?.message, error: data?.message || "" };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, error: "" };
  }
};
