import styled from "styled-components";
import BaseCard from "../BaseCard";

const getBgColor = (type: "green" | "red"): string => {
  const colors = {
    green:
      "linear-gradient(90deg, rgba(4, 165, 132, 0) 0%, rgba(4, 165, 132, 0.6) 100%)",
    red: "linear-gradient(90deg, rgba(255, 88, 88, 0) 0%, rgba(255, 88, 88, 0.6) 100%)",
  };

  return colors[type];
};

const getBorderColor = (type: "green" | "red"): string => {
  const colors = {
    green: "linear-gradient(90deg, rgba(4, 165, 132, 0) 0%, var(--color-primary) 100%)",
    red: "linear-gradient(90deg, rgba(255, 88, 88, 0) 0%, var(--color-danger) 100%)",
  };

  return colors[type];
};

export const Wrapper = styled(BaseCard)`
  width: 100%;
`;

export const Header = styled.div`
  max-width: 28%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 768px) {
    max-width: 90%;
  }
`;

export const ChartWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const ChartLabel = styled.div<{ width?: number }>`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16.8px;
  color: var(--main-black);
  white-space: nowrap;
  min-width: ${({ width }) => `${width || 0}px`};
`;

export const ChartBar = styled.div<{
  width: number;
  height: number;
  bg: "green" | "red";
}>`
  position: relative;
  height: ${({ height }) => `${height}px`};
  width: ${({ width }) => `${width}%`};
  background: ${({ bg }) => getBgColor(bg)};
  border-radius: 20px;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: -1.5px;
    border-radius: inherit;
    padding: 2px;
    background: ${({ bg }) => getBorderColor(bg)};
    mask:
      linear-gradient(white, white) content-box,
      linear-gradient(white, white);
    -webkit-mask:
      linear-gradient(white, white) content-box,
      linear-gradient(white, white);
    mask-composite: exclude;
    -webkit-mask-composite: destination-out;
  }
`;

export const CategoriesList = styled.div`
  margin-top: 20px;
`;

export const CategoriesBlock = styled.div``;

export const CategoriesProject = styled.div<{ isOpen: boolean }>`
  margin: ${({ isOpen }) =>
    isOpen ? "20px 0px 20px 40px" : "0px 0px 0px 40px"};
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.3s ease-in-out;
  max-height: ${({ isOpen }) => (isOpen ? "420px" : "0px")};
  overflow: ${({ isOpen }) => (isOpen ? "auto" : "hidden")};
  padding-right: ${({ isOpen }) => (isOpen ? "8px" : "0")};
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9dee7;
    border-radius: 999px;
  }

  @media (max-width: 768px) {
    margin: 0;
  }
`;

export const CategoriesBars = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: 20px;
`;

export const CategoriesButton = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  padding: 24px 3px;
  border-top: 1px solid #f0f2f5;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--input-hover);
  }

  & .rotate-90 {
    width: 16px;
    transition: transform 0.3s ease;
    transform: ${({ isOpen }) => (isOpen ? "rotate(0deg)" : "rotate(-90deg)")};
  }

  @media (max-width: 768px) {
    padding: 8px 3px;
  }
`;

export const CategoriesName = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17.15px;
  color: var(--main-black);
  width: 212px;
  text-align: right;
  @media (max-width: 768px) {
    width: 150px;
    text-align: center;
  }
`;

export const CategoriesItem = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  & .project {
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  & .project-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    div {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17.15px;
    }

    span {
      font-size: 10px;
      color: var(--main-gray);
    }
  }
`;

export const CategoriesItemCharts = styled.div`
  max-width: 50%;
  width: 100%;
`;
