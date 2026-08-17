import moment from "moment";

export const clarifyDate = (date: string) => {
    return `${moment(date).format('MMM d, YYYY')}`
}