import { API } from "../../config/api";
import { IPerson } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  personData: IPerson
): Promise<{ isSuccess: boolean; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const { body } = configureFetchForm("POST", personData, {});

    const res = await fetch(`${API}/persons/user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: body,
    });

    const data = await res.json();

    return { isSuccess: !data?.message, error: data?.message || "" };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, error: "" };
  }
};
