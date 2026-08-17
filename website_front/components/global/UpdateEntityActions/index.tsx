import React, { FC } from "react";
import { Wrapper } from "./styles";
import { useTranslation } from "i18n";

interface IProps {
  className?: string;
  isActiveEdit: boolean;
  isButtonText?: boolean;
  isResetButton?: boolean;
  buttonText?: string;
  updateEditState: (value: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const UpdateEntityActions: FC<IProps> = ({
  className,
  isActiveEdit,
  isResetButton = true,
  isButtonText = true,
  buttonText = "Edit Page",
  updateEditState,
  onSave,
  onCancel,
  onReset,
}) => {
  const { translateText } = useTranslation();

  return (
    <Wrapper className={className}>
      {isActiveEdit ? (
        <>
          <button onClick={onSave} className="green-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="16"
              viewBox="0 0 17 16"
              fill="none"
            >
              <path
                d="M9.46578 4.63364L11.8658 7.03364M3.46582 13.0336L6.37648 12.4472C6.53099 12.416 6.67287 12.3399 6.7843 12.2284L13.3001 5.70909C13.6125 5.39652 13.6123 4.88986 13.2996 4.57756L11.9193 3.19884C11.6068 2.88666 11.1004 2.88687 10.7881 3.19931L4.27166 9.71935C4.16045 9.83062 4.08452 9.97221 4.05336 10.1264L3.46582 13.0336Z"
                stroke="#04A584"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{translateText("Save Changes")}</span>
          </button>

          <button onClick={onCancel} className="red-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="16"
              viewBox="0 0 17 16"
              fill="none"
            >
              <path
                d="M11.1666 5.33203L5.83325 10.6654M11.1666 10.6654L5.83325 5.33203"
                stroke="#FF5858"
                strokeLinecap="round"
              />
            </svg>
            <span>{translateText("Cancel")}</span>
          </button>

          {isResetButton ? (
            <button onClick={onReset} className="reset-btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
              >
                <path
                  d="M3.74752 9.66797C4.42617 11.7973 6.36984 13.3346 8.6617 13.3346C11.518 13.3346 13.8334 10.9468 13.8334 8.0013C13.8334 5.05578 11.518 2.66797 8.6617 2.66797C6.74743 2.66797 5.07608 3.7405 4.18186 5.33464M5.75261 6.0013H3.16675V3.33464"
                  stroke="#738094"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{translateText("Reset")}</span>
            </button>
          ) : (
            <></>
          )}
        </>
      ) : (
        <button
          onClick={() => updateEditState(true)}
          className="green-btn edit-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="16"
            viewBox="0 0 17 16"
            fill="none"
          >
            <path
              d="M9.46578 4.63364L11.8658 7.03364M3.46582 13.0336L6.37648 12.4472C6.53099 12.416 6.67287 12.3399 6.7843 12.2284L13.3001 5.70909C13.6125 5.39652 13.6123 4.88986 13.2996 4.57756L11.9193 3.19884C11.6068 2.88666 11.1004 2.88687 10.7881 3.19931L4.27166 9.71935C4.16045 9.83062 4.08452 9.97221 4.05336 10.1264L3.46582 13.0336Z"
              stroke="#04A584"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isButtonText ? <span>{translateText(buttonText)}</span> : <></>}
        </button>
      )}
    </Wrapper>
  );
};

export default UpdateEntityActions;
