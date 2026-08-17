import { useEffect, useState } from "react";
import FillButton from "../button/fill_button"
import { useStyles } from "./styles";
import { login } from "../../services/auth/login";
import inputsHandler from "../../utils/inputsHandler";
import { useDispatch } from "react-redux";
import { setAuth,setRole } from "../../../store/slices/authSlice";
import { useHistory } from "react-router";
import Loader from "../loader";

const LoginForm = () => {
  const [loginData,setLoginData] = useState({email:'',password:''}) 
  const [loading,setLoading] = useState(false)
  const {wrapper,body,inputs,input} = useStyles()
  const dispatch = useDispatch()
  const navigation = useHistory()

  const confirmLogin = async (e:any) : Promise<void> => {
    try{
      e.preventDefault()
      setLoading(true)
      const {success,data} = await login(loginData)

      if(data.role.includes('moderator')){
        dispatch(setRole('moderator'))
      }
      if(data.role.includes('admin')){
        dispatch(setRole('admin'))
      }
      
      if(success){
        window.location.reload()
      }else{
        alert('Email or password is incсorect')
      }
      setLoading(false)
    }catch(error){
      setLoading(false)
      console.log(error)
    }
  }

  useEffect(() => {
    const token : string | null | undefined = localStorage.getItem('fomoAccessToken')
    const isAuth = token && token !== 'undefined'
    if(isAuth) navigation.push('/projects')
  },[])

  if(loading) return <Loader/>

  return (
    <div className={wrapper}>
      <form className={body} onSubmit={confirmLogin}>
          <div className={inputs}>
            <input 
            className={input}
            onChange={(e) => inputsHandler(e.target.name,e.target.value,setLoginData)}
            value={loginData.email} 
            autoComplete="username"
            type="text" 
            name="email" 
            placeholder="Email"
            />

            <input 
            className={input}
            onChange={(e) => inputsHandler(e.target.name,e.target.value,setLoginData)} 
            autoComplete="current-password"
            value={loginData.password} 
            type="password"
            name="password" 
            placeholder="********"
            />
          </div>
          <FillButton>Login</FillButton>
      </form>
    </div>
  )
}

export default LoginForm;