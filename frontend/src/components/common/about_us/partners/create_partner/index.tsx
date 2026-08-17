import { useState } from "react";
import { useStyles } from "./styles";
import { ICreatePartner } from "../../../../types/global_types";
import CreateButton from "../../../button/create_button";
import CloseIcon from "../../../Icons/close_icon";
import InputWithLabel from "../../../components_for_modals/input_with_label";
import inputsHandler from "../../../../utils/inputsHandler";
import FileInput from "../../../file_input";
import createPartner from "../../../../services/about_us/createPartner";
import FillButton from "../../../button/fill_button";
import reloadWindow from "../../../../utils/reloadWindow";

const CreatePartner = () => {
  const [isCreate,setIsCreate] = useState<boolean>(false)
  const [newPartner,setNewPartner] = useState<ICreatePartner>({url:''})
  
  const 
  {
    createWrapper,
    closeBtn,
    inputsWrapper
  } = useStyles()

  const confirmCreate = async () : Promise<void> => {
    await createPartner(newPartner)

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
          inputsHandler={(file:any) => setNewPartner((prev) => {
            return {...prev,img:file}
          })}
          data={{image:newPartner.img}}
          />
          <InputWithLabel
          label="Link:"
          value={newPartner.url}
          name={'url'}
          onChange={(value) => inputsHandler('url',value,setNewPartner)}
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

export default CreatePartner;
