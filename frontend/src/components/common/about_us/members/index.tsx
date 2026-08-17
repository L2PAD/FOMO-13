import { FC } from "react"
import { IMember } from "../../../types/global_types"
import Member from "./member"
import { useStyles } from "./styles"

interface IProps {
  type?:string
  members: Array<IMember>
}

const Members : FC<IProps> = ({members,type}) => {
  const {wrapper} = useStyles()
  
  return (
    <div className={wrapper}>
      {
        members?.length
        ?
        members.map((member : IMember) => {
          return <Member type={type} key={member._id} member={member}/>
        })
        :
        <></>
      }
    </div>
  )
}


export default Members;