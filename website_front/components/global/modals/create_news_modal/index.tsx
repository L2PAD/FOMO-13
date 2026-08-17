/* eslint-disable */
import React, { FC, useState, useContext } from "react";
import Modal from "../../common/Modal";
import { SubmitButton } from "../TelegramConnectionModal/styles";
import { toast } from "react-toastify";
import { LoadingContext, LocationContext, AuthContext } from "../../Layout";
import { ICreateNews } from "../../../../types/global_types";
import createNews from "../../../../http/news/createNews";
import InputWithLabel from "../../common/components_for_modals/input_with_label";
import RecommendationsModal from "../recommendations_modal/RecommendationsModal";
import ModalDatePicker from "../../common/components_for_modals/modal_date_picker";
import FileInput from "../../../UI/inputs/file_input";
import ModalSelect from "../../common/components_for_modals/modal_select";
import TextEditor from "../../common/text_editor/TextEditor";
import {
  ModalRow,
  ImageWrapper,
  Input,
  LabelTest,
  TextWrapper,
  BorderedButton,
} from "./styles";
import {
  LogoImage,
  LogoInput,
  LogoInputLabel,
  LogoWrapper,
} from "../creating_project/styles";
import FakeLogo from "../../Icons/FakeLogo";
import { Actions, ResetButton } from "../../UniversalFilter/styles";
import { Action } from "../../LeftNav/styles";
import Button from "../../common/Button";

interface Props {
  onClose: () => void;
}

const CreateNewsModal: FC<Props> = ({ onClose }) => {
  const { path } = useContext(LocationContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [newsData, setNewsData] = useState<ICreateNews>({
    title: "",
    type: "",
    date: new Date(),
    text: "",
    sourceUrl: "",
  });
  const [isRecModal, setIsRecModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Array<string>>([]);

  const inputsHandler = (
    value: string | File | Array<string>,
    inputName?: any
  ): void => {
    setNewsData((prev: ICreateNews) => {
      return { ...prev, [inputName]: value };
    });
  };

  const confirmCreateNews = async (): Promise<void> => {
    loadingStateHandler(true);

    const { isSuccess } = await createNews(
      { ...newsData, page: path || "crypto" },
      `news/create`
    );

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>The news has been sent for verification of moderation</p>
        </div>
      );
      onClose();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Your limit on creating news for today has been reached</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  const dateHandler = (value: any) => {
    inputsHandler(value, "date");
  };

  return isRecModal ? (
    <RecommendationsModal
      news={newsData}
      changeHandler={inputsHandler}
      onClose={() => setIsRecModal(false)}
    />
  ) : (
    <Modal
      className="creating_project_modal"
      title="Create news"
      onClose={onClose}
      variant="big"
    >
      <ModalRow>
        <InputWithLabel
          placeholder="Enter a short and clear headline for the news article"
          label="Title"
          value={newsData.title}
          onChange={(value: string) => inputsHandler(value, "title")}
          errorText={"Oops! Give it a title to continue!"}
          isError={validationErrors.includes("title")}
        />
      </ModalRow>
      <ModalRow>
        <InputWithLabel
          leftIcon={true}
          placeholder="Add a link to the original source"
          label="Source URL"
          value={newsData.sourceUrl}
          onChange={(value: string) => inputsHandler(value, "sourceUrl")}
        />
      </ModalRow>
      <ModalRow>
        <InputWithLabel
          placeholder="Add relevant tags (e.g., Token Unlock, Partnership, Launch, Hack, etc.)"
          label="Tags"
          value={newsData.type}
          onChange={(value: string) => inputsHandler(value, "type")}
          errorText={"Oops! Give it a title to continue!"}
          isError={validationErrors.includes("type")}
        />
      </ModalRow>
      <ModalRow>
        <p>Text</p>
      </ModalRow>
      <TextEditor
        value={newsData.text}
        name={"text"}
        handler={(name: string, value: string) => inputsHandler(value, name)}
      />
      <LogoWrapper>
        <p>Cover Image</p>
        <div>
          {newsData.image ? (
            <LogoImage
              //@ts-ignore
              src={URL.createObjectURL(newsData?.image)}
              alt="logo"
            />
          ) : (
            <FakeLogo />
          )}
          <LogoInputLabel htmlFor="logo-input">
            Tap to upload an image to represent the news (Max 15 MB,
            PNG/JPG/SVG)
          </LogoInputLabel>
          <LogoInput
            id="logo-input"
            name="image"
            type="file"
            onChange={(event: any) => {
              if (event.target.files) {
                inputsHandler(event.target.files[0], "image");
              }
            }}
          />
        </div>
      </LogoWrapper>
      {/* <ModalRow>
                    <p>Recommendations ({newsData.recommendations?.length || 0})</p>
                    <BorderedButton
                        onClick={() => setIsRecModal(true)}
                    >
                        + Change recommendations
                    </BorderedButton>
                </ModalRow> */}
      <Actions>
        <Action onClick={onClose} actionType="red">
          Cancel
        </Action>
        <Button onClick={confirmCreateNews} variant={"primary"}>
          Submit for Review
        </Button>
      </Actions>
      <ResetButton>
        <button
          onClick={() => {
            setNewsData({
              title: "",
              type: "",
              date: new Date(),
              text: "",
              sourceUrl: "",
            });
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="12"
            viewBox="0 0 13 12"
            fill="none"
          >
            <path
              d="M1.74776 7.66797C2.42642 9.79726 4.37008 11.3346 6.66194 11.3346C9.5182 11.3346 11.8337 8.94682 11.8337 6.0013C11.8337 3.05578 9.5182 0.667969 6.66194 0.667969C4.74768 0.667969 3.07632 1.7405 2.18211 3.33464M3.75285 4.0013H1.16699V1.33464"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Reset</span>
        </button>
      </ResetButton>
    </Modal>
  );
};

export default CreateNewsModal;
