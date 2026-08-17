import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"

export default async (promo: any): Promise<IReturnData> => {
    try {
        const token: string = getAccessToken()

        if (!token) {
            throw new Error('Not auth')
        }

        const response = await fetch(configureUrl(`layout/promo`), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(promo)
        });

        const data = await response.json().catch(() => ({}))

        return { success: response.status < 300, data }

    } catch (error) {
        console.log(error)
        return { success: false, data: error }
    }
}
