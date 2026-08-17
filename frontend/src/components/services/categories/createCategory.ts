import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

interface ICategoryPayload {
    name: string;
    type: string;
    page: string;
}

export default async (category: ICategoryPayload): Promise<IReturnData> => {
    try {
        const token: string = getAccessToken();

        if (!token) {
            throw new Error('Not auth');
        }

        const response = await fetch(`${configureUrl('categories')}/admin`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(category),
            credentials: 'include'
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to add category');
        }

        return { success: true, data: 'Category added' };
    } catch (error) {
        console.log(error);
        return { success: false, data: error };
    }
};
