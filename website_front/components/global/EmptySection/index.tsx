import React, { FC } from "react";
import styled from "styled-components";
import CreateButton from "../common/CreateButton";

const Wrapper = styled.div`
  max-width: 260px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;

  & .info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
  }

  &.small-empty-section {
    max-width: 360px;
    margin-bottom: 0px;
    padding-bottom: 0px;
    & .info-wrapper {
    }

    h4 {
      margin: 12px 0 12px;
      font-weight: var(--font-weight-semibold);
      font-size: 24px;
      line-height: 100%;
      text-align: center;
    }

    p {
      font-size: 14px;
      text-align: center;
    }
  }

  h4 {
    margin: 12px 0 16px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    text-align: center;
  }

  p {
    font-size: 16px;
    text-align: center;
  }

  &.big-empty-section {
    margin-top: 100px;
    max-width: 540px;
    h4 {
      margin: 20px 0 12px;
      font-weight: var(--font-weight-semibold);
      font-size: 24px;
      line-height: 100%;
      text-align: center;
    }

    p {
      font-size: 14px;
      text-align: center;
    }
  }
`;

interface IProps {
  className?: string;
  isFullAuth?: boolean;
  title?: string;
  description?: string;
  btnText?: string;
  onClick?: () => void;
}

const EmptySection: FC<IProps> = ({
  className,
  isFullAuth,
  title,
  description,
  btnText = "Add Info",
  onClick,
}) => {
  return (
    <Wrapper className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="22"
        viewBox="0 0 18 22"
        fill="none"
      >
        <path
          d="M12.0006 1.39844V4.99844C12.0006 5.66118 12.5378 6.19844 13.2006 6.19844H16.8006M15.0006 3.19844C14.4665 2.72058 13.9123 2.15382 13.5624 1.78572C13.3296 1.54077 13.0079 1.39844 12.67 1.39844H3.60029C2.27481 1.39844 1.2003 2.47295 1.20029 3.79842L1.2002 18.1984C1.20019 19.5239 2.2747 20.5984 3.60019 20.5984L14.4002 20.5984C15.7257 20.5984 16.8002 19.524 16.8002 18.1985L16.8006 5.47627C16.8006 5.16943 16.6835 4.87447 16.4706 4.65357C16.0768 4.24508 15.4191 3.57295 15.0006 3.19844Z"
          stroke="#04A584"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="info-wrapper">
        <h4>{title || "This section is empty"}</h4>
        <p>{description || "Add some details to complete the profile"}</p>
      </div>
      {onClick && isFullAuth ? (
        <CreateButton type="add" onClick={onClick}>
          {btnText}
        </CreateButton>
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default EmptySection;
