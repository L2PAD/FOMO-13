import { FC, useState } from "react"
import Button from "../../../common/button"
import SendMessageModal from "../../../common/sendMessageModal"
import Modal from "../../../common/modal"
import { useStyles } from "./styles"
import { IAttachmentReport } from "../../../types/global_types"

interface IProps {
    visible:boolean,
    modalHandler:any,
    supportItem:any | IAttachmentReport
}

const AllSupportData : FC<IProps> = ({modalHandler,supportItem}) => {
    const {
        TextWrapper,
        ButtonWrapper
    } = useStyles()
    const [isSendMessage,setIsSendMessage] = useState<boolean>(false)
    
  return (
    isSendMessage || supportItem?.creator?.email
    ?
    <SendMessageModal
    userChatId={supportItem?.userData?.telegramData?.telegramId || supportItem?.creator?.telegramData?.telegramId}
    userEmail={supportItem?.userData?.email || supportItem?.creator?.email} 
    isVisible={isSendMessage || supportItem?.creator?.email}
    onClose={() => {
        setIsSendMessage(false)
        modalHandler(false)
    }}
    />
    :
    <Modal
    onClose={modalHandler}
    variant={"medium"}
    title={supportItem.theme}
    >
        <div
        className={TextWrapper}
        >
            {supportItem.message}
        </div>
        {
            supportItem?.userData?.telegramData?.telegramId && supportItem?.userData?.email
            ?
            <div className={ButtonWrapper}>
            <Button
            type={'lightFill'}
            onClick={() => setIsSendMessage(true)}
            >
                Send asnwer
            </Button>
            </div>
            :
            <></>
        }

    </Modal>
  )
}

export default AllSupportData
