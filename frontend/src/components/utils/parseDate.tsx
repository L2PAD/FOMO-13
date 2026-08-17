
export default (date : Date, type? : number) : string => {
    if(type === 1){
        return String(`${new Date(date).getDate() > 9 ? new Date(date).getDate() : `0${new Date(date).getDate()}`}.${new Date(date).getMonth() > 9 ? new Date(date).getMonth() : `0${new Date(date).getMonth()}`}.${new Date(date).getFullYear()} ${new Date(date).getHours()}:${new Date(date).getMinutes() > 9 ? new Date(date).getMinutes() : `0${new Date(date).getMinutes()}`}`)
    }

    if(type === 2){
        const day = String(new Date(date)).split(' ')[0]
        return String(`${new Date(date).toDateString().split(' ')[1]} ${day}, ${new Date(date).getFullYear()}`)
    }

    if(type === 3){
        const day = String(new Date(date)).split(' ')[0]
        return String(`${day} ${new Date(date).toDateString().split(' ')[1]}, ${new Date(date).getFullYear()}`)
    }

    return String(`${new Date(date).toDateString().split(' ')[1]} ${new Date(date).getDate()}, ${new Date(date).getFullYear()}`)
}