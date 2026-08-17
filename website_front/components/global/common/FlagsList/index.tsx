import React, { FC } from "react";
import { FlagsListItem, FlagsList } from "./styles";
import { IFlag } from "../../../../types/global_types";
import { CloseIcon } from "../../Icons";
import CreateButton from "../CreateButton";
import Input from "../Input";
import { InputLabel } from "../OfficialLinks/styles";
import upperCaseFirstLetter from "../../../../helpers/upperCaseFirstLetter";
import EmptySection from "../../EmptySection";
import { useTranslation } from "i18n";

interface IProps {
  isEditState: boolean;
  onChange: (items: Array<IFlag>) => void;
  type: "red" | "yellow" | "green";
  flags: Array<IFlag>;
}

const FLAG_COLORS: Record<IProps["type"], string> = {
  green: "#04A584",
  yellow: "#FFC702",
  red: "#FF5858",
};

const FlagsListComponent: FC<IProps> = ({
  type,
  flags,
  isEditState,
  onChange,
}) => {
  const { translateText } = useTranslation();
  const flagColor = FLAG_COLORS[type];

  const addInputs = (): void => {
    onChange([...flags, { text: "", link: "", type: type === "green" }]);
  };

  const removeInput = (id: number): void => {
    onChange(
      flags.filter((item, i: number) => {
        return id !== i;
      })
    );
  };

  const inputHandler = (id: number, text: string): void => {
    const updatedFlags: Array<IFlag> = flags.map(
      (item: IFlag, index: number) => {
        if (index === id) {
          return { ...item, text };
        }

        return item;
      }
    );

    onChange(updatedFlags);
  };

  return (
    <FlagsList variant="main">
      <ul>
        {flags?.length ? (
          flags.map((flag: IFlag, index: number) => {
            return (
              <FlagsListItem key={index}>
                {!isEditState ? (
                  <div style={{ minWidth: "12px", height: "12px" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      min-width="12"
                    >
                      <path
                        d="M11.3332 0.667969H2.12105V6.23319H11.3332L9.87862 3.45058L11.3332 0.667969Z"
                        fill={flagColor}
                      />
                      <path
                        d="M0.666504 11.3346H3.57559M2.12105 6.23319V0.667969H11.3332L9.87862 3.45058L11.3332 6.23319H2.12105ZM2.12105 6.23319V10.8709"
                        stroke={flagColor}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : (
                  <></>
                )}
                {isEditState ? (
                  <Input
                    className="width100"
                    inputClassname="flags-input"
                    leftIcon={
                      <InputLabel>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="17"
                          viewBox="0 0 16 17"
                          fill="none"
                        >
                          <path
                            d="M2.66675 13.8346H5.57584M4.12129 8.73319V3.16797H13.3334L11.8789 5.95058L13.3334 8.73319H4.12129ZM4.12129 8.73319V13.3709"
                            stroke="#738094"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </InputLabel>
                    }
                    placeholder={translateText(`Add ${type} flag details`)}
                    type="text"
                    value={flag.text}
                    onChange={(value: string) => inputHandler(index, value)}
                  />
                ) : (
                  <span>{flag.text}</span>
                )}
                {isEditState ? (
                  <button
                    onClick={() => removeInput(index)}
                    className="remove-btn"
                  >
                    <CloseIcon fill="#738094" />
                  </button>
                ) : (
                  <></>
                )}
              </FlagsListItem>
            );
          })
        ) : (
          <EmptySection />
        )}
        {isEditState ? (
          <CreateButton type="add" onClick={addInputs}>
            {translateText(`Add ${upperCaseFirstLetter(type)} Flag`)}
          </CreateButton>
        ) : (
          <></>
        )}
      </ul>
    </FlagsList>
  );
};

export default FlagsListComponent;
