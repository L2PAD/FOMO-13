import { API } from "../../config/api";
import { ICreateDeal, IDeal } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

type actionType =
    | "start"


export default async (
    action: actionType,
    id: string,
): Promise<{ isSuccess: boolean; deal: IDeal | null }> => {
    try {
        const accessToken: string | null = getAuthToken();

        const res = await fetch(`${API}/deals/p2p/${action}/${id}`, {
            method: "PATCH",
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
