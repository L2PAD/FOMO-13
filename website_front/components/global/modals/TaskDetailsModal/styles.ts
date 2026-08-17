import styled from "styled-components";

export const Wrapper = styled.div``;

export const InfoColumn = styled.div`
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  & hr {
    opacity: 0.4;
  }
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const InfoKey = styled.div`
  color: gray;
  font-size: 14px;
`;

export const DescriptionWrapper = styled.div`
  font-size: 17px;
  font-weight: var(--font-weight-regular);
`;

export const InfoText = styled.div`
  font-size: 17px;
  font-weight: var(--font-weight-regular);
`;

export const ActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 40px;
  margin-left: auto;
  gap: 10px;

  button {
    width: 100%;
  }
`;

export const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

export const InfoProject = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;

  & img {
    max-width: 38px;
    height: 38px;
    object-fit: cover;
  }
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #80808070;
  background: #8080800f;
  transition: all 0.3s ease;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;

export const InfoProjectColumn = styled.div`
  display: flex;
  align-items: start;
  flex-direction: column;
  gap: 4px;
`;

export const InfoProjectTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 15px;
`;

export const InfoProjectText = styled.div`
  font-size: 14px;
`;

export const TimeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 14px;

  & i {
    font-weight: var(--font-weight-semibold);
  }
  & span {
    font-size: 12px;
  }
`;

export const TaskStatus = styled.div<{ isActive?: boolean }>`
  color: ${(props) => (props.isActive ? "var(--color-primary)" : "#8a8a00")};
  font-size: 20px;
  text-align: center;
  margin: 15px auto;
`;
