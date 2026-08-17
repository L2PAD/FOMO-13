import { FC, useState } from "react";
import { useStyles } from "./styles";
import { ICreateMember } from "../../../../types/global_types";
import CreateButton from "../../../button/create_button";
import CloseIcon from "../../../Icons/close_icon";
import InputWithLabel from "../../../components_for_modals/input_with_label";
import inputsHandler from "../../../../utils/inputsHandler";
import FileInput from "../../../file_input";
import createMember from "../../../../services/about_us/createMember";
import FillButton from "../../../button/fill_button";
import reloadWindow from "../../../../utils/reloadWindow";

const CreateMember : FC<{type:'member' | 'team'}> = ({type}) => {
  const [isCreate,setIsCreate] = useState<boolean>(false)
  const [newMember,setNewMember] = useState<ICreateMember>({name:'',lastname:'',profession:''})
  
  const 
  {
    createWrapper,
    closeBtn,
    inputsWrapper
  } = useStyles()

  const confirmCreate = async () : Promise<void> => {
    await createMember(newMember,type)

    reloadWindow()
  }

  return (
      isCreate
      ?
      <div className={createWrapper}>
        <button 
        className={closeBtn}
        onClick={() => setIsCreate(false)}>
          <CloseIcon/>
        </button>
        <div className={inputsWrapper}>
          <FileInput
          inputsHandler={(file:any) => setNewMember((prev) => {
            return {...prev,avatar:file}
          })}
          data={{image:newMember.avatar}}
          />
          <InputWithLabel
          label="Name:"
          value={newMember.name}
          name={'name'}
          onChange={(value) => inputsHandler('name',value,setNewMember)}
          />
          <InputWithLabel
          label="Last name:"
          value={newMember.lastname}
          name={'lastname'}
          onChange={(value) => inputsHandler('lastname',value,setNewMember)}
          />
          <InputWithLabel
          label="Profession:"
          value={newMember.profession}
          name={'profession'}
          onChange={(value) => inputsHandler('profession',value,setNewMember)}
          />
          <FillButton
          onClick={confirmCreate}
          >
            Create
          </FillButton>
        </div>
      </div>
      :
      <CreateButton
      width="250px"
      height="250px"
      onClick={() => setIsCreate(true)}
      />
  )
}

export default CreateMember;
