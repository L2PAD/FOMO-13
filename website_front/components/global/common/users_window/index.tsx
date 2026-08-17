import React, { FC, useCallback } from "react";
import { CloseIcon } from "../../Icons";
import { DeleteButton, UserData, UserRow, Wrapper } from "./styles";
import avatarImage from "../../../../assets/img/avatar.png";
import imageLoader from "../../../../helpers/imageLoader";
import { Investor, IProject } from "../../../../types/global_types";

interface Props {
  investors?: Array<Investor>;
  data?: IProject;
  inputsHandler?: (value: any, inputName: string) => void;
  inputName?: string;
}

const UsersListWindow: FC<Props> = ({
  investors,
  data,
  inputsHandler,
  inputName,
}) => {
  const deleteInvestorFromList = useCallback(
    (id: string) => {
      if (!data || !inputsHandler) return;

      // @ts-ignore
      const currentItems: Array<any> | undefined = investors;

      inputsHandler(
        currentItems?.filter((investor) => {
          return investor._id !== id;
        }),
        inputName || "investors"
      );
    },
    [data, investors]
  );

  return (
    <Wrapper>
      {investors &&
        investors.map((investor: Investor) => {
          return (
            <UserRow key={investor._id}>
              <UserData>
                <img
                  src={imageLoader(String(investor.logo))}
                  alt={investor.name}
                />
                {investor.name}
              </UserData>
              <DeleteButton
                onClick={() => deleteInvestorFromList(investor._id)}
              >
                <CloseIcon fill="#FF5858" />
              </DeleteButton>
            </UserRow>
          );
        })}
    </Wrapper>
  );
};

export default UsersListWindow;
