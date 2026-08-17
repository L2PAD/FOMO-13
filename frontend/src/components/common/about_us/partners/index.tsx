import { FC } from "react"
import { IPartner } from "../../../types/global_types"
import { useStyles } from "./styles"
import Partner from "./partner"

interface IProps {
  partners: Array<IPartner>
}

const Partners : FC<IProps> = ({partners}) => {
  const {wrapper} = useStyles()
  
  return (
    <div className={wrapper}>
      {
        partners?.length
        ?
        partners.map((partner : IPartner) => {
          return <Partner key={partner._id} partner={partner}/>
        })
        :
        <></>
      }
    </div>
  )
}


export default Partners;    