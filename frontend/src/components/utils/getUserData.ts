import { IUser } from "../types/global_types";

export default () : IUser => {
    return JSON.parse(localStorage.getItem('fomoUser') || '')
}