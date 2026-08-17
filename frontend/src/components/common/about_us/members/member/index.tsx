import { FC } from "react"
import { IMember } from "../../../../types/global_types"
import loader from "../../../../services/loader"
import { useStyles } from "./styles"
import Button from "../../../button"
import DeleteIcon from "../../../Icons/delete_icon"
import deleteMember from "../../../../services/about_us/deleteMember"
import reloadWindow from "../../../../utils/reloadWindow"
import deletePartner from "../../../../services/about_us/deletePartner"

interface IProps {
    type?:string
    member : IMember
}

const Member : FC<IProps> = ({member,type}) => {
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

    const confrimDeleteMember = async () : Promise<void> => {
        type === 'team'
        ?
        await deletePartner(member._id,'team')
        :
        await deleteMember(member._id)
        reloadWindow()
    }

  return (
    <div className={wrapper}>
        <div className={head}>
            <img src={loader(member.avatar)} alt="" />
            <div className={info}>
                <div className={infoItem}>
                    <span className={key}>Name:</span>
                    <span className={value}>{member.name}</span>
                </div>
                <div className={infoItem}>
                    <span className={key}>Last name:</span>
                    <span className={value}>{member.lastname}</span>
                </div>
            </div>
        </div>
        <div className={details}>
            <div className={infoItem}>
                <span className={key}>Profession :</span>
                <span className={value}>{member.profession}</span>
            </div>
        </div>
        <div className={buttons}>
            <Button onClick={confrimDeleteMember}>
                <DeleteIcon/>
            </Button>
        </div>
    </div>
  )
}


export default Member;