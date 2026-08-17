import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
`;

export const Item = styled(BaseCard)`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Category = styled.div`
  padding: 4px 10px;
  color: var(--main-green);
  background: #e9f8f8;
  border-radius: 6px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 20px;
`;

export const Text = styled.div`
  margin: 20px 0;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 100%;
  color: var(--main-black);
`;

export const UserInfo = styled.div``;

export const UserDetails = styled.div``;
