import getAccessToken from '../../utils/getAccessToken'
import { configureUrl } from '../config'
import { IReturnData } from '../types'

export default async (): Promise<IReturnData> => {
  try {
    const token: string = getAccessToken()

    if (!token) {
      throw new Error('Not auth')
    }

    const projectsResponce = await fetch(configureUrl(`comments/admin/reported`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await projectsResponce.json()

    return { success: true, data:{total:data?.length,data} }
  } catch (error) {
    console.log(error)
    return { success: false, data: [] }
  }
}
