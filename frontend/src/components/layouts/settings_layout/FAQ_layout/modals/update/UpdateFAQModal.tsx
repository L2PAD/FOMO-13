import {FC, useEffect, useState} from 'react'
import Button from '../../../../../common/button'
import Modal from '../../../../../common/modal'
import InputWithLabel from '../../../../../common/components_for_modals/input_with_label'
import { CloseIcon } from '../../../../../../assets'
import { FAQItem } from '../..'
import createFag from '../../../../../services/fag/createFag'
import { useStyles } from './styles'
import updateFag from '../../../../../services/fag/updateFag'

interface IProps {
    isVisible:boolean
    onClose:() => void 
    onUpdateFAQ:(faq:FAQItem) => void
    faqInitial:FAQItem 
}

const UpdateFAQModal : FC<IProps> = ({isVisible,onClose,onUpdateFAQ,faqInitial}) => {
    const {
        wrapper,
        faqItems,
        faqItem,
        textField,
        textFieldWrapper,
        closeItem
    } = useStyles()
    const [faqData,setFaqData] = useState<FAQItem>(faqInitial)

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

    const confirmUpdateFag = async () : Promise<void> => {
        const {success} = await updateFag(String(faqData._id),faqData)

        if(success){
            onClose()
            onUpdateFAQ(faqData)
            setFaqData({title:'',description:'',items:[]})
        }
    }

    useEffect(() => {
        setFaqData(faqInitial)
    },[faqInitial])

  return (
        isVisible
        ?
        <Modal
        variant={"big"}
        onClose={onClose}
        title={'Update FAQ Item'}
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
                    onClick={confirmUpdateFag}
                    type={'fill'}
                    >
                        Update
                    </Button>
                </div>
            </div>
        </Modal>
        :
        <></>
  )
}

export default UpdateFAQModal
