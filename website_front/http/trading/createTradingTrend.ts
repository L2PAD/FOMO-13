import { API } from "../../config/api";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export interface ICreateTrading {
    projectId: string;
    twitterAccs: string[]
    keywords: string[],
}

export default async (
    tradingData: ICreateTrading
): Promise<{ isSuccess: boolean; error: string }> => {
    try {
        const accessToken: string | null = getAuthToken();

        const res = await fetch(`${API}/trading`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tradingData),
        });

        const data = await res.json();

        return { isSuccess: !data?.message, error: data?.message || "" };
    } catch (error) {
        console.error(error);
        return { isSuccess: false, error: "" };
    }
};
