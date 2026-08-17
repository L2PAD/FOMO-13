
export default (word:string):any => {
    return word.split('')[0].toUpperCase() + word.slice(1,word.length)
}