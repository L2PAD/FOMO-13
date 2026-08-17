export default () : string => {
    return localStorage.getItem('fomoAccessToken') || ''
}