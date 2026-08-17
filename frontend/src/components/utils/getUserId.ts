
export default () : string => {
    return localStorage.getItem('fomoUserId') || ''
}