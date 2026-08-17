import { FC, useState } from "react"
import { IMessageTelegram } from "../../types/global_types"
import Checkbox from "../checkbox"
import sendMessage from "../../services/messages/sendMessage"
import InputWithLabel from "../components_for_modals/input_with_label"
import FileInput from "../file_input"
import Button from "../button"
import Modal from "../modal"
import { useStyles } from "./styled"
import Loader from "../loader"

interface IProps {
    userId:string,
    isVisible:boolean,
    onClose:() => void
}

const ActionMessageModal : FC<IProps> = ({userId,isVisible,onClose}) => {
    const {
        wrapper,
        textField,
        textFieldWrapper,
        checkBoxWrapper
    } = useStyles()
    const [loading,setLoading] = useState<boolean>(false)
    const [data,setData] = useState<IMessageTelegram>({title:'',message:''})

    const confirmSendMessage = async () : Promise<void> => {
      setLoading(true)

      await sendMessage({...data,to:userId})

      setData({title:'',message:''})
      onClose()

      setLoading(false)
    }

    if(loading) return <Loader/>

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

export default ActionMessageModal
