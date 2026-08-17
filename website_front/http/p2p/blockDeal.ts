import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export const blockDeal = async (
    dealId: string,
    dealIdSmart?: number | null
): Promise<{ success: boolean; message?: string }> => {
    try {
        const accessToken: string | null = getAuthToken();
        const query = dealIdSmart ? `?dealIdSmart=${dealIdSmart}` : "";

        const res = await fetch(`${API}/deals/block/${dealId}${query}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (res.status < 300) {
            return { success: true };
        } else {
            const error = await res.json();
            return { success: false, message: error.message || "Failed to block deal" };
        }
    } catch (error) {
        console.error("Error blocking deal:", error);
        return { success: false, message: "Network error" };
    }
};

export const updateBlockedDeal = async (dealId: string, action: 'confirm' | 'reject'): Promise<{ success: boolean; message?: string }> => {
    try {
        const accessToken: string | null = getAuthToken();

        const res = await fetch(`${API}/deals/block/${action}/${dealId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (res.status < 300) {
            return { success: true };
        } else {
            const error = await res.json();
            return { success: false, message: error.message || `Failed to ${action} deal` };
        }
    } catch (error) {
        console.error(`Error ${action}ing deal:`, error);
        return { success: false, message: "Network error" };
    }
};
