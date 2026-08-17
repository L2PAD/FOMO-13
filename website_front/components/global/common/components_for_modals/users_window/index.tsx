/* eslint-disable */
import React, { FC } from "react";
import { CloseIcon } from "../../../Icons";
import { DeleteButton, UserData, UserRow, Wrapper } from "./styles";
import { Investor } from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";

interface IProps {
  investors: Investor[];
  dataHandler?: (investor: Investor) => void;
}

const UsersWindow: FC<IProps> = ({ investors, dataHandler }) => {
  return (
    <Wrapper>
      {investors?.length ? (
        investors.map((investor: Investor) => {
          return (
            <UserRow key={investor._id}>
              <UserData>
                <img
                  src={
                    typeof investor.logo === "string"
                      ? imageLoader(investor.logo)
                      : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  }
                  alt={investor.name}
                />
                {investor.name}
              </UserData>
              <DeleteButton
                onClick={() => dataHandler && dataHandler(investor)}
              >
                <CloseIcon fill="#FF5858" />
              </DeleteButton>
            </UserRow>
          );
        })
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default UsersWindow;
