import {FC, useState} from 'react'
import Modal from '../../../../../common/modal'
import FileInput from '../../../../../common/file_input'
import InputWithLabel from '../../../../../common/components_for_modals/input_with_label'
import ModalDatePicker from '../../../../../common/components_for_modals/modal_date_picker'
import { IBannerItem } from '../../../../../types/global_types'
import inputsHandler from '../../../../../utils/inputsHandler'
import Button from '../../../../../common/button'
import Loader from '../../../../../common/loader'
import updateBannerItem from '../../../../../services/banner/updateBannerItem'
import reloadWindow from '../../../../../utils/reloadWindow'
import { 
  Wrapper,
  InputsWrapper,
  Key,
  DateInputWrapper
 } from './styles'
import Checkbox from '../../../../../common/checkbox'
import { CheckboxWrapper } from '../../../../../common/filterUser/styles'

interface IProps {
  initial:IBannerItem
  page:string,
  isVisible:boolean 
  onClose: (value:any) => void 
}

const UpdateBanner : FC<IProps> = ({initial,page,isVisible,onClose}) => {
  const [loading,setLoading] = useState<boolean>(false)
  const [data,setData] = useState<IBannerItem>(initial)

  const confirmUpdateSlide = async () => {
    setLoading(true)

    const res = await updateBannerItem({...data,page},String(data._id))

    if(res.success){
      onClose(false)
      setData(initial) 
      reloadWindow()
    }

    setLoading(false)
  }

  if(loading) return <Loader/>

  return (
    isVisible 
    ?
    <Modal
    title='Update banner'
    onClose={() => onClose(false)}
    variant={'medium'}
    >
      <Wrapper>
        <InputsWrapper>
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
          <CheckboxWrapper>
            <Checkbox
            labelValue='Show timer'
            active={!!data.isTimerVisible}
            onChange={() => inputsHandler('isTimerVisible',!data.isTimerVisible,setData)}
            />
          </CheckboxWrapper>
          {
            data.isTimerVisible
            ?
            <>
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
          inputLabel='Img'
          data={{image:data.img}}
          inputsHandler={(file:any) => inputsHandler('img',file,setData)}
          />
          <Button
          onClick={confirmUpdateSlide}
          type={'bordered'}
          >
            Update slide
          </Button>
        </InputsWrapper>
      </Wrapper>
    </Modal>
    :
    <></>
  )
}

export default UpdateBanner
