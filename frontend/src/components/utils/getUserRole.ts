export default () : string => {
    return localStorage.getItem('fomoRole') || ''
}