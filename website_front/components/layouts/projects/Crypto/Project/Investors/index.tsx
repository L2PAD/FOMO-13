import React, { useState, FC, useContext } from "react";
import Link from "next/link";
import EditItemsButton from "../../../../../global/common/EditItemsButton";
import { Investor } from "../../../../../../types/global_types";
import { AuthContext } from "../../../../../global/Layout";
import {
  InvestorsContainer,
  InvestorsWrapper,
  PersonCardWrapper,
  ShowAllButton,
  ShowAllWrapper,
  Title,
  Wrapper,
} from "./styles";

interface IProps {
  items?: Array<Investor>;
  toggleUpdateModal?: () => void;
  isEdit?: boolean;
}

const Investors: FC<IProps> = ({ items, toggleUpdateModal, isEdit }) => {
  const { userData } = useContext(AuthContext);
  const [showAll, setShowAll] = useState(false);

  return (
    <Wrapper>
      <Title variant="p">Investors</Title>
      {isEdit ? (
        <EditItemsButton
          type="investors"
          onClick={() => toggleUpdateModal && toggleUpdateModal()}
        />
      ) : (
        <></>
      )}
      <InvestorsContainer>
        <InvestorsWrapper>
          {items?.map((item: Investor, i: number) => {
            if (!showAll) {
              if (i < 5) {
                return (
                  <Link href="/crypto/persons/123" key={i}>
                    {/*//@ts-ignore*/}
                    <PersonCardWrapper {...item} />
                  </Link>
                );
              }
              return null;
            }
            return (
              <Link href="/crypto/persons/123" key={i}>
                {/*//@ts-ignore*/}
                <PersonCardWrapper {...item} />
              </Link>
            );
          })}
        </InvestorsWrapper>
      </InvestorsContainer>
      <ShowAllWrapper>
        <ShowAllButton onClick={() => setShowAll((state) => !state)}>
          {showAll ? "Hide" : "Show"} all
        </ShowAllButton>
      </ShowAllWrapper>
    </Wrapper>
  );
};
export default Investors;
