import {FC, useState} from 'react'
import Button from '../../../../../common/button'
import Modal from '../../../../../common/modal'
import InputWithLabel from '../../../../../common/components_for_modals/input_with_label'
import { CloseIcon } from '../../../../../../assets'
import { FAQItem } from '../..'
import createFag from '../../../../../services/fag/createFag'
import { useStyles } from './styles'

interface IProps {
    isVisible:boolean
    onClose:() => void 
    onCreatedNewFAQ?:(faq:FAQItem) => void
    isLocalFAQ?:boolean
    saveLocalFaq?:(faq:FAQItem) => void
}

const CreateFAQModal : FC<IProps> = ({isVisible,onClose,onCreatedNewFAQ,isLocalFAQ,saveLocalFaq}) => {
    const {
        wrapper,
        faqItems,
        faqItem,
        textField,
        textFieldWrapper,
        closeItem
    } = useStyles()
    const [faqData,setFaqData] = useState<FAQItem>({title:'',description:'',items:[]})

    const inputsHandler = (name:string,value:string) : void => {
        setFaqData((prev:FAQItem) => {
            return ({
                ...prev,
                [name]:value
            })
        })
    }

    const addItemToFAQ = () : void => {
        setFaqData((prev:FAQItem) => {
            return ({
                ...prev,
                items:[...prev.items,{title:'',description:''}]
            })
        })
    }

    const removeItemFromFAQ = (index:number) : void => {
        setFaqData((prev:FAQItem) => {
            return ({
                ...prev,
                items:prev.items.filter((item:any,i:number) => index !== i)
            })
        })
    }

    const faqItemInputsHandler = (name:string,value:string,index:number) : void => {
        setFaqData((prev:FAQItem) => {
            return (
                {
                    ...prev,
                    items: prev.items.map((item:{title:string,description:string},faqIndex:number) => {
                        if(index === faqIndex){
                            return {
                                ...item,
                                [name]:value
                            }
                        }
    
                        return item
                    })
                }
            )
        })
    }

    const confirmCreateFag = async () : Promise<void> => {
        const {success,data} = await createFag(faqData)

        if(success){
            onClose()
            onCreatedNewFAQ && onCreatedNewFAQ(data)
            setFaqData({title:'',description:'',items:[]})
        }
    }

  return (
        isVisible
        ?
        <Modal
        variant={"big"}
        onClose={onClose}
        title={'Create FAQ Item'}
        >
            <div className={wrapper}>
                <InputWithLabel
                label={'Section title:'}
                value={faqData.title}
                onChange={(value:string) => inputsHandler('title',value)}
                />
                <InputWithLabel
                label={'Section description:'}
                value={faqData.description}
                onChange={(value:string) => inputsHandler('description',value)}
                />
                <div className={faqItems}>
                    {
                        faqData.items.map((item:{title:string,description:string},index:number) => {
                            return (
                                <div 
                                className={faqItem}
                                key={index}>
                                    <div className={closeItem}>
                                        <Button type='empty' onClick={() => removeItemFromFAQ(index)}>
                                            <CloseIcon/>
                                        </Button>
                                    </div>
                                    <InputWithLabel
                                    label={"Item title"}
                                    value={item.title}
                                    onChange={(value:string) => faqItemInputsHandler('title',value,index)}
                                    />
                                    <div className={textFieldWrapper}>
                                        <label>
                                            Item description
                                        </label>
                                        <textarea
                                        value={item.description}
                                        onChange={(e:any) => faqItemInputsHandler('description',e.target.value,index)}
                                        className={textField}
                                        />
                                    </div>
                                </div>
                            )
                        })
                    }
                    <Button
                    onClick={addItemToFAQ}
                    type={'bordered'}
                    >
                        +
                    </Button>
                    <Button
                    onClick={
                        isLocalFAQ && saveLocalFaq
                        ?
                        () => saveLocalFaq(faqData)
                        :
                        confirmCreateFag
                    }
                    type={'fill'}
                    >
                        Create
                    </Button>
                </div>
            </div>
        </Modal>
        :
        <></>
  )
}

export default CreateFAQModal
