
export default (inputName:string,value:string | Date | number | boolean,stateHandler:any) : void => {
    stateHandler((prevState:any) => ({...prevState,[inputName]:value}))
}