import { localApi } from "../config";
import { IWithdraw } from "../../types/global_types";
import getAccessToken from "../../utils/getAccessToken";


export const approveWithdraw = async (
    id: string,
): Promise<{ isSuccess: boolean; withdraw: IWithdraw | null; message?: string }> => {
    try {
        const accessToken: string | null = getAccessToken();

        if (!accessToken) {
            return { isSuccess: false, withdraw: null, message: 'No access token' };
        }

        const res = await fetch(`${localApi}/withdraws/${id}/approve`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                isSuccess: false,
                withdraw: null,
                message: data.message || `Error ${res.status}: ${res.statusText}`
            };
        }

        return { isSuccess: true, withdraw: data };
    } catch (error) {
        console.error('Error approving withdraw:', error);
        return {
            isSuccess: false,
            withdraw: null,
            message: error instanceof Error ? error.message : 'Network error'
        };
    }
};

export const rejectWithdraw = async (
    id: string,
): Promise<{ isSuccess: boolean; withdraw: IWithdraw | null; message?: string }> => {
    try {
        const accessToken: string | null = getAccessToken();

        if (!accessToken) {
            return { isSuccess: false, withdraw: null, message: 'No access token' };
        }

        const res = await fetch(`${localApi}/withdraws/${id}/reject`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                isSuccess: false,
                withdraw: null,
                message: data.message || `Error ${res.status}: ${res.statusText}`
            };
        }

        return { isSuccess: true, withdraw: data };
    } catch (error) {
        console.error('Error rejecting withdraw:', error);
        return {
            isSuccess: false,
            withdraw: null,
            message: error instanceof Error ? error.message : 'Network error'
        };
    }
};