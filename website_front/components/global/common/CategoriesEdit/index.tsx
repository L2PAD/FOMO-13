import React, { FC, useState } from "react";
import Button from "../Button";
import { InputLabel, Inputs, LinksWrapper, Wrapper } from "./styles";
import Input from "../Input";
import { CloseIcon } from "../../Icons";

interface IProps {
  categories: Array<string>;
  onChange: (items: Array<string>) => void;
}

const CategoriesEdit: FC<IProps> = ({ categories, onChange }) => {
  const addInputs = (): void => {
    onChange([...categories, ""]);
  };

  const removeInput = (id: number): void => {
    onChange(
      categories.filter((item, i: number) => {
        return id !== i;
      })
    );
  };

  const linkInputHandler = (id: number, text: string): void => {
    const updatedLinks: Array<string> = categories.map(
      (item: string, index: number) => {
        if (index === id) {
          return text;
        }

        return item;
      }
    );

    onChange(updatedLinks);
  };

  return (
    <Wrapper>
      <Inputs>
        {categories.map((item: any, i: number) => {
          return (
            <Input
              key={i}
              className="input-width"
              placeholder="Enter category"
              leftIcon={
                <InputLabel>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M11.0237 4.97959L11.0193 4.97956M13.2241 1.6455L9.19611 1.33565C8.83899 1.30818 8.4877 1.43813 8.23443 1.6914L1.69286 8.23297C1.21371 8.71212 1.21371 9.48898 1.69286 9.96813L6.03074 14.306C6.50988 14.7852 7.28674 14.7852 7.76589 14.306L14.3075 7.76443C14.5607 7.51116 14.6907 7.15987 14.6632 6.80275L14.3534 2.77472C14.3069 2.17134 13.8275 1.69191 13.2241 1.6455Z"
                      stroke="#738094"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </InputLabel>
              }
              value={item}
              onChange={(value: string) => linkInputHandler(i, value)}
            />
          );
        })}
      </Inputs>
      <Button onClick={addInputs} className="add-link" variant="outlined">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="9"
          height="8"
          viewBox="0 0 9 8"
          fill="none"
        >
          <path
            d="M4.50078 0.800781L4.50078 7.20078M7.70078 4.00078L1.30078 4.00078"
            stroke="#04A584"
            strokeLinecap="round"
          />
        </svg>
        Add Category
      </Button>
      <LinksWrapper>
        {categories.map((item: string, i: number) => {
          return (
            <div key={i}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M11.0237 4.97959L11.0193 4.97956M13.2241 1.6455L9.19611 1.33565C8.83899 1.30818 8.4877 1.43813 8.23443 1.6914L1.69286 8.23297C1.21371 8.71212 1.21371 9.48898 1.69286 9.96813L6.03074 14.306C6.50988 14.7852 7.28674 14.7852 7.76589 14.306L14.3075 7.76443C14.5607 7.51116 14.6907 7.15987 14.6632 6.80275L14.3534 2.77472C14.3069 2.17134 13.8275 1.69191 13.2241 1.6455Z"
                  stroke="#738094"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{item}</span>
              <button className="remove-btn" onClick={() => removeInput(i)}>
                <CloseIcon fill="#738094" />
              </button>
            </div>
          );
        })}
      </LinksWrapper>
    </Wrapper>
  );
};

export default CategoriesEdit;
