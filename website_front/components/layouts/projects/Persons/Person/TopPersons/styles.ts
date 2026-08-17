import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import { ProfileHorizontalList } from "../../../shared/ProfilePageShell";

export const Wrapper = styled.div`
  min-width: 0;
  margin-top: 32px;

  h2 {
    margin: 0 0 16px;
    color: var(--color-text-primary);
    font-size: 22px;
    font-weight: var(--font-weight-semibold);
    line-height: 28px;
  }

  @media (max-width: 768px) {
    margin-top: 24px;

    h2 {
      margin-bottom: 12px;
      font-size: 18px;
      line-height: 23px;
    }
  }
`;
export const Assets = styled(ProfileHorizontalList)`
  & > .profile-list-card {
    flex: 0 0 280px;
    min-width: 280px;
  }

  & > .profile-list-empty {
    flex: 1 0 100%;
    min-width: 100%;
  }
`;

export const Asset = styled(BaseCard)`
  width: 100%;
  min-width: 280px;
  height: 100%;
`;

export const ProjectData = styled.div`
  display: flex;
  min-width: 0;
  gap: 8px;

  & .info {
    min-width: 0;

    div {
      overflow: hidden;
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    span {
      display: block;
      overflow: hidden;
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

export const PriceInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  & .info-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;

    & > span {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 100%;
      color: var(--main-gray);
    }

    span {
      margin-left: 0px;
    }
  }
`;
