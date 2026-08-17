import { FC } from "react"
import { IPartner } from "../../../../types/global_types"
import loader from "../../../../services/loader"
import { useStyles } from "./styles"
import Button from "../../../button"
import DeleteIcon from "../../../Icons/delete_icon"
import deletePartner from "../../../../services/about_us/deletePartner"
import reloadWindow from "../../../../utils/reloadWindow"

interface IProps {
    partner : IPartner
}

const Partner : FC<IProps> = ({partner}) => {
    const 
    {
        wrapper,
        head,
        info,
        infoItem,
        key,
        value,
        details,
        buttons
    } = useStyles()

    const confrimDeletePartner = async () : Promise<void> => {
        await deletePartner(partner._id)
        reloadWindow()
    }

  return (
    <div className={wrapper}>
        <div className={head}>
            <img src={loader(partner.img)} alt="" />
        </div>
        <div className={info}>
                <div className={infoItem}>
                    <span className={key}>Link:</span>
                    <span className={value}>{partner.url}</span>
                </div>
            </div>
        <div className={buttons}>
            <Button onClick={confrimDeletePartner}>
                <DeleteIcon/>
            </Button>
        </div>
    </div>
  )
}


export default Partner;