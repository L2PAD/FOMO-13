import {FC, useState} from 'react'
import InputWithLabel from '../../../../common/components_for_modals/input_with_label'
import { changeYellowTime } from '../../../../smart/initialSmartMain'
import Button from '../../../../common/button'
import Modal from '../../../../common/modal'
import { BodyWrapper, LabelWrapper } from './styles'

interface IProps {
  poolId:number
  modalHandler:(value:any) => void 
  isVisible:boolean 
}

const YellowTime : FC<IProps> = ({poolId,modalHandler,isVisible}) => {
  const [time,setTime] = useState<number>(300)

  const confirmChangeTime = async () : Promise<void> => {
    modalHandler(false)
    
    const {success} = await changeYellowTime(poolId,time)

    if(success){
      setTime(0)
      modalHandler(false)
    }
  }
 
  return (
    isVisible
    ?
    <Modal
    onClose={() => modalHandler(false)}
    title={'Change yellow time'}
    >
      <BodyWrapper>
        <LabelWrapper>
          Time between participants in yellow zone (seconds)
        </LabelWrapper>
        <InputWithLabel
        value={String(time)}
        onChange={(value:any) => setTime(Number(value))}
        type={'number'}
        label=''
        />
        <Button
        type={'bordered'}
        onClick={confirmChangeTime}
        >
          Confirm
        </Button>
      </BodyWrapper>
    </Modal>
    :
    <></>
  )
}

export default YellowTime
