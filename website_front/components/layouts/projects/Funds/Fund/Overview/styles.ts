import styled from "styled-components";
import {
  ProfileSectionStack,
  ProfileSectionTitle,
} from "../../../shared/ProfilePageShell";

export const Wrapper = styled(ProfileSectionStack)``;

export const Title = styled(ProfileSectionTitle)`
  overflow-wrap: anywhere;

  & .total-investment {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 4px;

    div {
      font-weight: var(--font-weight-regular);
      font-size: 16px;
      line-height: 19.2px;
    }

    span {
      font-weight: var(--font-weight-semibold);
      font-size: 20px;
      line-height: 24px;
    }
  }

  @media (max-width: 768px) {
    & .total-investment span {
      font-size: 18px;
      line-height: 22px;
    }
  }
`;
