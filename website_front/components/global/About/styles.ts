import styled from "styled-components";
import Input from "../common/Input";
import { SearchIcon } from "../Icons";
import Button from "../common/Button";

export const AboutPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  a {
    color: black;
  }
`;

export const AboutHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
  .logo {
    margin-top: 8px;
  }
  @media (max-width: 1000px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    grid-template-areas:
      "logo buttons"
      "center center";

    .buttons {
      grid-area: buttons;
      margin-left: auto;
    }

    .center {
      grid-area: center;
    }
  }

  .links {
    a {
      width: fit-content;
      text-align: center;

      @media (max-width: 575px) {
        padding: 5px !important;
      }
    }
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: center;
  }

  & > div {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .center {
    align-items: center;

    p {
      color: var(--color-text-muted);
      font-weight: var(--font-weight-semibold);
      text-align: center;
    }
  }

  .buttons {
    align-items: flex-end;

    .buy {
      font-size: 18px;
    }
  }
`;

export const JoinWrapper = styled.div`
  max-width: 600px;
  margin: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;

  p {
    font-size: 18px;
    padding: 0 10px;
  }

  .links {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;

    a {
      width: max-content;
      font-size: 16px;
      padding: 8px;
    }
  }

  .button {
    box-shadow: 0px 1px 2px 0px #00000040;
    background: var(--color-primary)1a;
    color: var(--color-primary);
    margin: 20px;
    padding: 10px;
    width: 300px;
    border-radius: 20px;
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }
`;

export const AboutWrapper = styled.div`
  padding: 30px;
  margin: auto;
  max-width: 1250px;
  width: 100%;

  p,
  b {
    font-size: 14px;
  }

  h1 {
    text-align: center;
  }

  li {
    list-style: inside !important;
  }

  .button {
    margin-left: auto;
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .bold {
    text-align: center;
    font-weight: var(--font-weight-semibold);
    margin: 10px;
  }

  .list {
    display: flex;
    justify-content: space-between;
    margin-top: 50px;
    margin-bottom: 50px;
    text-align: center;
    gap: 20px;
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: calc(100vw - 60px);
    h2 {
      margin-bottom: 10px !important;
      text-align: center;
      line-height: 110%;
    }
    h3 {
      margin-bottom: 5px !important;
      text-align: center;
    }
    div {
      max-width: 260px;
      min-width: 200px;
    }
  }

  .images {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-gap: 50px;
    margin: 50px;

    @media (max-width: 1100px) {
      grid-gap: 10px;
      margin: 50px 0;
    }

    @media (max-width: 900px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 900px) {
      grid-gap: 1px;
    }

    img {
      border-radius: 10px;
      margin: auto;
    }
  }

  .statuses {
    display: flex;
    justify-content: center;
    gap: 10px;

    p {
      padding-top: 2px;
    }
  }

  .left {
    text-align: left;
  }

  .status-list {
    p {
      padding: 3px;
      margin-left: 15px;
    }
  }

  .done,
  .work,
  .upcoming {
    position: relative;
    line-height: 15px;

    &::before {
      content: "";
      display: block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      position: absolute;
      top: 7px;
      left: -12px;
    }
  }

  .done {
    &::before {
      background: #05c9a1;
    }
  }

  .work {
    &::before {
      background: #f9a353;
    }

    &::after {
      content: "";
      display: block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #f9a35340;
      position: absolute;
      top: 4px;
      left: -15px;
    }
  }

  .upcoming {
    &::before {
      background: #b9c0ca;
    }
  }
`;
export const SearchWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 524px;

  button {
    font-size: 18px;
  }
`;

export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    box-shadow: 1px 1px 1px 0px #00000040;

    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }
`;

export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 7px;

  path {
    fill: var(--color-text-muted)80;
  }
`;

export const WalletButton = styled(Button)`
  color: #0b6920;
  border: 1px solid #0b6920;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 16px;

  &:hover {
    background: #0b6920;
  }
`;

export const BuyButton = styled(Button)`
  color: #0b6920;
  white-space: nowrap;

  &:hover {
    color: #0b6920;
  }
`;

export const AboutText = styled.div`
  p {
    font-size: 16px;
    margin-top: 12px;
  }
`;
