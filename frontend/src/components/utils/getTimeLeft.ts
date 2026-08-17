

export default (date:Date) : Array<string> => {
    const result = []

    const resultDate = Math.ceil(Math.abs(new Date().getTime() - date.getTime()) / (1000 * 3600 * 24))

    return []
}