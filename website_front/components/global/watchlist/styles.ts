import styled from "styled-components";

interface FilterItemProps {
  isSelected: boolean;
}

export const Wrapper = styled.div``;

export const FilterItem = styled.button<FilterItemProps>`
  background-color: ${(props) =>
    props.isSelected ? "transparent" : "transparent"};
  color: ${(props) =>
    props.isSelected ? "var(--main-black)" : "var(--main-gray)"};
  padding: 10px 12px;
  border: none;
  font-weight: ${(props) => (props.isSelected ? 600 : 400)};
  font-size: 16px;
  line-height: 19px;
  box-shadow: ${(props) =>
    props.isSelected ? "0px 4px 0px -1px var(--color-primary)" : "none"};
`;
