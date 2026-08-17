export const clarifyAmount = (amount: number) => {

    const getFixed = (num: number) => {
        if (amount % num === 0) {
            return amount
        } else {
            return (amount / num).toFixed(1)
        }
    }

    if (amount < 999999) {
        return String(amount).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1.')
    } else if (amount < 999999999) {
        return `${String(getFixed(1000000)).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1.')}M`
    } else {
        return`${String(getFixed(1000000000)).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1.')}B`
    }
}