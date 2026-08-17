// services/getTradings.ts
import { API } from "../../config/api";
import { ITradingData } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
    type: 'public' | 'private'
): Promise<{ isSuccess: boolean; tradings: ITradingData[] }> => {
    try {
        const token: string | null = getAuthToken();

        const path = type === 'public' ? '/trading/public' : '/trading/private';

        const res = await fetch(`${API}${path}`, {
            method: "GET",
            headers: {
                ...(type === 'private' && token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();

        const tradings: ITradingData[] = data;

        return { isSuccess: res.status < 300, tradings };
    } catch (error) {
        console.error(error);
        return { isSuccess: false, tradings: [] };
    }
};
