import { FC, useState } from "react"
import { IMessageTelegram } from "../../types/global_types"
import Checkbox from "../checkbox"
import sendMessage from "../../services/telegram/sendMessage"
import sendEmail from '../../services/email/sendEmail'
import InputWithLabel from "../components_for_modals/input_with_label"
import FileInput from "../file_input"
import Button from "../button"
import Modal from "../modal"
import { useStyles } from "./styled"

interface IProps {
    userEmail:string,
    userChatId:string,
    isVisible:boolean,
    onClose:() => void
}

const SendMessageModal : FC<IProps> = ({userEmail,userChatId,isVisible,onClose}) => {
    const {
        wrapper,
        textField,
        textFieldWrapper,
        checkBoxWrapper
    } = useStyles()
    const [isTelegramSend,setIsTelegramSend] = useState<boolean>(true)
    const [isEmailSend,setIsEmailSend] = useState<boolean>(true)
    const [data,setData] = useState<IMessageTelegram>({title:'',message:''})

    const confirmSendMessage = async () : Promise<void> => {
        if(!isTelegramSend && !isEmailSend) return
   
        let isSuccess = false

        if(userEmail && isEmailSend){
            const {success} = await sendEmail(userEmail,data)
            isSuccess = success
        }
        
        if(userChatId && isTelegramSend){
            const {success} = await sendMessage(userChatId,data)
            isSuccess = success
        }
        if(isSuccess){
            onClose()
            setData({title:'',message:'',file:null})
        }

        isSuccess = false
    }

  return (
        isVisible 
        ?
        <Modal
        onClose={onClose}
        title={'Send message'}
        >
          <div className={wrapper}>
            <InputWithLabel
            label={'Title:'}
            value={data.title}
            onChange={(value) => setData((prev:any) => {
                return {...prev,title:value}
            })}
            />
            <div className={textFieldWrapper}>
                <label htmlFor="text-message">
                    Message:
                </label>
                <textarea
                id={'text-message'}
                value={data.message}
                onChange={(e) => setData((prev:any) => {
                    return {...prev,message:e.target.value}
                })}
                className={textField}
                />
            </div>
            <FileInput
            data={{image:data.file}}
            inputsHandler={(file:any) => setData((prev:any) => {
                return {...prev,file:file}
            }) }
            />
            <div className={checkBoxWrapper}>
                <Checkbox
                labelValue={'Telegram'}
                active={isTelegramSend}
                onChange={() => setIsTelegramSend((prev:boolean) => !prev)}
                />
                <Checkbox
                labelValue={'Email'}
                active={isEmailSend}
                onChange={() => setIsEmailSend((prev:boolean) => !prev)}
                />
            </div>
            <Button
            type={'lightFill'}
            onClick={confirmSendMessage}
            >
              Confirm
            </Button>
          </div>
        </Modal>
        :
        <></>
  )
}

export default SendMessageModal
