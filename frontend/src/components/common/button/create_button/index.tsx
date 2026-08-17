import { FC } from "react"
import { useStyles } from "./styles"

interface IProps {
    width:string 
    height:string
    onClick: () => void
}

const CreateButton : FC<IProps> = ({width,height,onClick}) => {
    const {wrapper} = useStyles()

  return (
    <button
    className={wrapper}
    onClick={onClick}
    style={{width,height}}
    >
        +
    </button>
  )
}

export default CreateButton;