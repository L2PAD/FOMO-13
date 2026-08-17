import styled from "styled-components";

export const InviteWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 2px #00053026;
`;

export const InviteInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 32px;
`;

export const InviteInfoKey = styled.div`
  color: rgba(115, 128, 148, 1);
  font-size: 14px;
  padding-bottom: 6px;
`;

export const InviteInfoBoard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 50%;
    overflow: hidden;
  }
`;

export const InviteBoardName = styled.div`
  & div {
    margin-bottom: 6px;
  }

  & h4 {
    font-size: 16px;
  }
`;

export const InviteBoardDescription = styled.div``;

export const InviteUserWrapper = styled.div`
  & h4 {
  }
`;

export const InviteActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  button {
    width: 88px;
  }
`;

export const InviteUserName = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
`;

export const InviteUserInfo = styled.div`
  span {
    font-size: 14px;
    color: var(--color-text-muted);
  }
`;

export const InviteUserBody = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 50%;
    overflow: hidden;
  }
`;
