import { FC, useState } from "react"
import { IBannerItem } from "../../../../types/global_types"
import { EditIcon } from "../../../../../assets"
import useTimer from "../../../../hooks/useTimerWithTime"
import Button from "../../../../common/button"
import DeleteIcon from "../../../../common/Icons/delete_icon"
import deleteBannerItem from "../../../../services/banner/deleteBannerItem"
import loader from "../../../../services/loader"
import Loader from "../../../../common/loader"
import UpdateBanner from "../modals/update_banner"
import { 
  TimerBlockWrapper,
  TimerButton,
  TimerSecondTitle,
  TimerTitle,
  TimerValue,
  TimerWrapper,
  ButtonsWrapper
 } from "./styles"


interface IProps {
    item:IBannerItem
    onDelete:(id:string) => void
}

const BannerItem : FC<IProps> = ({item,onDelete}) => {
  const [isUpdateModal,setIsUpdateModal] = useState<boolean>(false)
  const [loading,setLoading] = useState(false)
  const timer = useTimer(item.date,item.timeStart)

  const confirmDeleteBanner = async () : Promise<void> => {
    setLoading(true)

    const {success} = await deleteBannerItem('banner',item._id || '')

    if(success){
      onDelete(String(item._id))
    }

    setLoading(false)
  }

  if(loading) return <Loader/>

  return (
    <>
    <TimerBlockWrapper>
    <img
      width={594}
      height={330}
      src={loader(String(item.img))}
      alt={item._id}
    />
    {
      item.isTimerVisible
      ?
      <TimerWrapper>
      <TimerTitle variant="p">{item.title}</TimerTitle>
      <TimerSecondTitle variant="p">
        {item.description}
      </TimerSecondTitle>
      <p />
      <TimerSecondTitle variant="p">Contribution Closes:</TimerSecondTitle>
      <TimerValue>
        {timer.days}d {timer.hours}h {timer.minutes}m {timer.seconds}s
      </TimerValue>
      <TimerButton
      target={'_blank'}
      href={item.link}
      >
        See details
      </TimerButton>
    </TimerWrapper>
    :
    <></>
    }

    <ButtonsWrapper>
        <Button
        onClick={() => setIsUpdateModal(true)}
        >
          <EditIcon/>
        </Button>
        <Button
        onClick={confirmDeleteBanner}
        >
          <DeleteIcon/>
        </Button>
    </ButtonsWrapper>
    </TimerBlockWrapper>
    <UpdateBanner
    isVisible={isUpdateModal}
    page="gemslab"
    initial={item}
    onClose={setIsUpdateModal}
    />
    </>
  )
}

export default BannerItem
