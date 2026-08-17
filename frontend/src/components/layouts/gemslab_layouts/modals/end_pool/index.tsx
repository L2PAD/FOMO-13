import { FC, useState } from "react"
import { endPoolByAdmin } from "../../../../smart/initialSmartMain"
import endProject from "../../../../services/projects/endProject"
import Modal from "../../../../common/modal"
import Button from "../../../../common/button"
import { ButtonsWrapper } from "./styles"
import reloadWindow from "../../../../utils/reloadWindow"

interface IProps {
    isVisible:boolean 
    modalHandler:(value:any) => void 
    projectId:string 
    poolId:number 
}

const EndPool : FC<IProps> = ({isVisible,modalHandler,projectId,poolId}) => {

    const confirmEndPool = async (isRefund:boolean) : Promise<void> => {
        const {success} = await endPoolByAdmin(poolId,isRefund)

        if(!success) return 

        const result = await endProject(projectId,isRefund)

        if(!result.success){
            alert(String(result.data))
            return
        }

        modalHandler(false)        
        reloadWindow()
    }

  return (
    isVisible
    ?
    <Modal
    onClose={() => modalHandler(false)}
    title={'End pool'}
    >
        <ButtonsWrapper>
            <Button
            type={'bordered'}
            onClick={() => confirmEndPool(false)}
            >
              End pool
            </Button>
            <Button
            type={'bordered'}
            onClick={() => confirmEndPool(true)}
            >
              End pool with refund 
            </Button>
        </ButtonsWrapper>
    </Modal>
    :
    <></>
  )
}

export default EndPool
