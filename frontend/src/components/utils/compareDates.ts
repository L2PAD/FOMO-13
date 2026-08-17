
export default (firstDate:Date,secondDate:Date) : boolean  => {
    const first = `${firstDate.getDate()}.${firstDate.getDay()}.${firstDate.getMonth()}.${firstDate.getFullYear()}`
    const second = `${secondDate.getDate()}.${secondDate.getDay()}.${secondDate.getMonth()}.${secondDate.getFullYear()}`

    return first === second
}