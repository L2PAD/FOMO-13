
export default (address:string,sliceType = '5x5') : string => {
    if(!address) return ''

    const addressLength = address?.length

    if(sliceType === '5x5'){
        return `${address.slice(0,5)}....${address.slice(addressLength - 5,addressLength)}`
    }

    if(sliceType === '2x4'){
        return `${address.slice(0,6)}....${address.slice(addressLength - 4,addressLength)}`
    }

    return address
}