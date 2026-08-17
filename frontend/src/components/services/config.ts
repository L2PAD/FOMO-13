const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')
const stripApiSuffix = (value: string): string => value.replace(/\/api$/, '')

export const apiBaseUrl = trimTrailingSlash(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000')
// export const apiBaseUrl = 'https://fomoland-backend-production.up.railway.app'
// export const apiBaseUrl = 'https://api.fomo.cx'

export const localApi = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
export const loaderApi = stripApiSuffix(apiBaseUrl)

export const configureUrl = (path:string) : string => {
    return `${localApi}/${path}`
}

export const configureFetchForm = (method:'POST' | 'PUT' | 'DELETE',body:object,headers:any) => {
    const data = new FormData();

    Object.entries(body).forEach((item) => {
        let isReturn = false
        const key:string = item[0]
        let value:any = item[1]
        
        if(key === 'fullness'){
            value = value + '%'
        }
        if(key === 'investors'){
            data.append(key,value?.map((item:any) => item?._id))
            isReturn = true
        }
        if(!isReturn){
            data.append(key,value)
        }
    })
    
    return {
        method,
        headers,
        body: data
    }
}

export const configureProjectForm = (method:'POST' | 'PUT' | 'DELETE',body:object,headers:any) => {
    const data = new FormData();

    Object.entries(body).forEach((item) => {
        let isReturn = false
        const key:string = item[0]
        let value:any = item[1]
        if(key === 'fullness'){
            value = value + '%'
        }
        if(key === 'investors'){
            data.append(key,value?.map((item:any) => item?._id))
            isReturn = true
        }

        if(key === 'team'){
            data.append(key,value?.map((item:any) => item?._id))
            isReturn = true
        }

        if(key === 'partners'){
            data.append(key,value?.map((item:any) => item?._id))
            isReturn = true
        }

        if(key === 'faq'){
            data.append(key,JSON.stringify(value))
            isReturn = true
        }

        if(key === 'recommendations'){
            data.append(key,value)
            isReturn = true
        }
        if(!isReturn){
            data.append(key,value)
        }
    })
    
    return {
        method,
        headers,
        body: data
    }
}
