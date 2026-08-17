import getAccessToken from "../../utils/getAccessToken"
import { configureUrl } from "../config"
import { IReturnData } from "../types"

interface QueryWithdrawParams {
    page?: number;
    limit?: number;
    status?: string;
    currency?: 'ETH' | 'USDC';
    userId?: string;
    search?: string;
}

export default async (params: QueryWithdrawParams): Promise<IReturnData> => {
    try {
        const token: string = getAccessToken()

        if (!token) {
            throw new Error('Not auth')
        }

        const queryParams = new URLSearchParams()

        if (params.page) queryParams.append('page', params.page.toString())
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.status) queryParams.append('status', params.status)
        if (params.currency) queryParams.append('currency', params.currency)
        if (params.userId) queryParams.append('userId', params.userId)
        if (params.search) queryParams.append('search', params.search)

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

        const response = await fetch(configureUrl(`withdraws${queryString}`), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        })

        const data = await response.json()

        return {
            success: response.status < 300,
            data,
        }

    } catch (error) {
        console.log('Withdraws fetch error:', error)
        return {
            success: false,
            data: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}