export default (array:Array<any>,type?:string) : Array<any> => {
    
    if(!array.length) return []

    if(type === 'end') {
        return array.sort((a:any,b:any) => {
            const dateA : any = new Date(a.actionDate || a.createDate || a.date)
            const dateB : any = new Date(b.actionDate || b.createDate || b.date)
  
            return dateA - dateB
        })
    }

    return array.sort((a:any,b:any) => {
        const dateA : any = new Date(a.actionDate || a.createDate || a.date)
        const dateB : any = new Date(b.actionDate || b.createDate || b.date)

        return dateB - dateA
    })
}