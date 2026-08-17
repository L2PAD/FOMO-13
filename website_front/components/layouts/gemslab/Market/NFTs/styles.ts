import styled from "styled-components";

export const NFTCardWrapper = styled.div`
  margin-top: 15px;
  height: 320px;
  width: 274px !important;
  margin-right: 4px;

  & > div {
    width: 274px !important;
  }
`;

export const Wrapper = styled.div<{ arrow?: boolean }>`
  position: relative;
  display: grid;
  justify-content: space-between;
  align-items: center;
  grid-template-columns: 1fr ${({ arrow }) => (arrow ? "35px" : "0px")};
  gap: 12px;
  margin-bottom: -60px;

  @media (max-width: 1210px) {
    grid-template-columns: 1fr;
  }

  .arrow {
    width: 35px;
    height: 35px;
    cursor: pointer;

    @media (max-width: 1210px) {
      display: none;
    }
  }
`;

export const NFTsCardsWrapper = styled.div<{ arrow?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: center;
  overflow-x: scroll;
  overflow-y: hidden;
`;
export const NftsEmptyWrapper = styled.div`
  margin-top: 6px;
`;
