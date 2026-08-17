import {FC, useState} from 'react'
import Modal from '../../../../../common/modal'
import FileInput from '../../../../../common/file_input'
import InputWithLabel from '../../../../../common/components_for_modals/input_with_label'
import ModalDatePicker from '../../../../../common/components_for_modals/modal_date_picker'
import { IBannerItem } from '../../../../../types/global_types'
import inputsHandler from '../../../../../utils/inputsHandler'
import Button from '../../../../../common/button'
import Loader from '../../../../../common/loader'
import createBannerItem from '../../../../../services/banner/createBannerItem'
import Checkbox from '../../../../../common/checkbox'
import { 
  Wrapper,
  InputsWrapper,
  Key,
  DateInputWrapper
 } from './styles'
import { CheckboxWrapper } from '../../../../../common/filterUser/styles'

interface IProps {
  page:string,
  isVisible:boolean 
  onClose: (value:any) => void 
  addItemToList:(item:IBannerItem) => void
}

const initial : IBannerItem = {
  link:'',
  title:'',
  date:new Date(),
  timeStart:'',
  img:'',
  description:'',
  isTimerVisible:false
}

const CreateBanner : FC<IProps> = ({page,isVisible,onClose,addItemToList}) => {
  const [loading,setLoading] = useState<boolean>(false)
  const [data,setData] = useState<IBannerItem>(initial)

  const confirmCreateSlide = async () => {
    setLoading(true)

    const res = await createBannerItem({...data,page})

    if(res.success){
      onClose(false)
      addItemToList(res.data)
      setData(initial) 
    }

    setLoading(false)
  }

  if(loading) return <Loader/>

  return (
    isVisible 
    ?
    <Modal
    title='Create banner'
    onClose={() => onClose(false)}
    variant={'medium'}
    >
      <Wrapper>
      <CheckboxWrapper>
          <Checkbox
          labelValue='Show timer'
          active={!!data.isTimerVisible}
          onChange={() => inputsHandler('isTimerVisible',!data.isTimerVisible,setData)}
          />
          </CheckboxWrapper>
        <InputsWrapper>
          {
            data.isTimerVisible
            ?
            <>
                      <InputWithLabel
          placeholder='Banner title'
          value={data.title}
          label={'Title:'}
          name={'title'}
          onChange={(value:any,name:any) => inputsHandler(name,value,setData)}
          />
          <InputWithLabel
          placeholder='Text text text'
          value={data.description}
          label={'Description:'}
          name={'description'}
          onChange={(value:any,name:any) => inputsHandler(name,value,setData)}
          />
          <InputWithLabel
          placeholder='https://example.com'
          value={data.link}
          label={'Link:'}
          name={'link'}
          onChange={(value:any,name:any) => inputsHandler(name,value,setData)}
          />

            <DateInputWrapper>
            <label
            className={Key}
            >
              Date end:
            </label>
            <ModalDatePicker
            name={'date'}
            date={new Date(data.date)}
            onChange={(value:any,name:string) => inputsHandler(name,value,setData)}
            />
            </DateInputWrapper>
            <InputWithLabel
            placeholder='24:00' 
            value={data.timeStart}
            label={'Time:'}
            name={'timeStart'}
            onChange={(value:any,name:any) => inputsHandler(name,value,setData)}
            />
            </>
            :
            <></>
          }
          <FileInput
          inputLabel='Img (610x220)'
          data={{image:data.img}}
          inputsHandler={(file:any) => inputsHandler('img',file,setData)}
          />
          <Button
          onClick={confirmCreateSlide}
          type={'bordered'}
          >
            Create slide
          </Button>
        </InputsWrapper>
      </Wrapper>
    </Modal>
    :
    <></>
  )
}

export default CreateBanner
