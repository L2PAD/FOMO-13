import styled from "styled-components";

export const Container = styled.div`


`;

export const Grid = styled.div`

`;

export const Panel = styled.div`
  background: var(--color-white);
  display: flex;
  flex-direction: column;

  &.list{
      min-height: 460px;
  }
`;

export const PanelHeader = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

export const PanelTitle = styled.div`
  text-align: center;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  color: var(--color-text-primary);
`;

export const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    background: #f7f8fb;
  }

  &.plus{
    color: var(--main-green);
    background: #E9F8F8;
    padding: 6px 8px;
    transition: background 0.2s ease;
    &:hover {
      background: #D1F0F0;
    }

    &:active {
      background: #B3E7E7;}
  }
`;

export const Plus = styled.span`
  font-size: 18px;
  line-height: 1;
  color: #2d9cdb;
`;

export const MethodList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const MethodItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #f0f2f6;
  background: var(--color-white);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #f7f8fb;
    border-color: #e4e7ec;
  }
`;

export const MethodInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const MethodIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export const MethodBadge = styled.div<{ $variant: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: ${({ $variant }) => {
    switch ($variant) {
      case "google_pay":
        return "linear-gradient(135deg, #4285f4, #34a853)";
      case "apple_pay":
        return "#111111";
      case "bank":
        return "#0e1726";
      default:
        return "var(--color-text-secondary)";
    }
  }};
`;

export const MethodTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const MethodSubtitle = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
`;

export const Chevron = styled.div`
  display: flex;
  align-items: center;
  color: #98a2b3;
`;

export const PanelFooter = styled.div`
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  justify-content: stretch;

  &.align-bottom {
    margin-top: 8px;
  }

  &.center {
    justify-content: center;
  }

  .primary-btn {
    width: 100%;
    border-radius: 10px;
  }

  .button-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .danger-btn {
    border-color: #ff5c5c;
    color: #ff5c5c;

    &:hover {
      background: #ffefef;
    }
  }

  .red-btn {
    background: transparent;
    border: none;
    color: var(--main-red);
    padding: 0;
    height: auto;
    min-height: auto;
    box-shadow: none;
  }
`;

export const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const Input = styled.input`
  width: 100%;
  height: 38px;
  border-radius: 8px;
  border: 1px solid #eef0f4;
  padding: 0 12px;
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-white);

  &::placeholder {
    color: #98a2b3;
  }
`;

export const Select = styled.select`
  width: 100%;
  height: 38px;
  border-radius: 8px;
  border: 1px solid #eef0f4;
  padding: 0 12px;
  font-size: 14px;
  color: var(--color-text-muted);
  background: var(--color-white);
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const ErrorText = styled.div`
  font-size: 12px;
  color: #ff5c5c;
`;

export const EmptyState = styled.div`
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed #e4e7ec;
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
`;
