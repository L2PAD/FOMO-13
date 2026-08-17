import { API } from "../../config/api";
import { DealSection, IComment, IDeal } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (section: DealSection): Promise<{ isSuccess: boolean; deal: IDeal | null }> => {
    try {
        const accessToken: string | null = getAuthToken();

        const res = await fetch(`${API}/deals/promote/current/${section}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await res.json();

        return { isSuccess: res.status < 300, deal: data };
    } catch (error) {
        console.log(error);

        return { isSuccess: false, deal: null };
    }
};
