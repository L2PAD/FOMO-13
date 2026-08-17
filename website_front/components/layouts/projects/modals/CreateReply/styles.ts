import styled from "styled-components";

export const ReplyWrapper = styled.div`
  position: relative;
  margin: 15px 0;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 4px 4px 0px 0px #eeeeee;
  border: 1px solid var(--color-text-secondary)12;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &.subitem {
    margin-left: 50px;

    &.first::before {
      content: "";
      background-image: url(/static/common/arrow.png);
      background-size: contain;
      background-repeat: no-repeat;
      width: 40px;
      height: 40px;
      margin-left: -50px;
    }
  }

  .flex {
    display: flex;
    gap: 5px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    position: relative;

    .pin1 {
      display: none;
      position: absolute;
      right: 0;

      @media (max-width: 600px) {
        display: block;
      }
    }

    .items {
      display: flex;
      align-items: center;
      gap: 15px;

      .pin {
        display: block;

        @media (max-width: 600px) {
          display: none;
        }
      }

      p,
      b,
      svg {
        font-size: 14px;
      }

      p {
        color: var(--color-text-muted);
      }

      .icons {
        display: flex;
        align-items: center;

        .left {
          margin-left: 5px;
        }
      }
    }
  }

  .button {
    font-size: 18px;
    display: flex;
    align-items: center;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;

    svg {
      height: 24px;
    }

    span {
      @media (max-width: 440px) {
        display: none;
      }
    }
  }

  .footer {
    display: flex;
    justify-content: space-between;

    .likes {
      display: flex;
      gap: 5px;

      .like,
      .dislike {
        padding: 3px 10px;
        border-radius: 99px;
        display: flex;
        gap: 5px;
        align-items: center;
        font-weight: var(--font-weight-semibold);
        transition: all 0.1s ease;

        &:hover {
          background: var(--color-primary);
          color: var(--color-white);
        }
        &:active {
          opacity: 0.7;
        }
      }

      .dislike {
        background: #f8f8f9;
      }

      .like {
        background: #f8f8f9;
      }
      .selected {
        background: var(--color-primary);
        color: var(--color-white);
      }
    }
  }
`;

export const Description = styled.div`
  margin-top: 8px;
  margin-bottom: 16px;
`;

export const ThemeWrapper = styled.div`
  margin-bottom: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
  input {
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }
`;

export const ProjectsWrapper = styled.div`
  margin-bottom: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
`;

export const DropdownWrapper = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  position: absolute;
  top: 30px;
  width: 100%;
  left: 0;
  max-height: 200px;
  height: max-content;
  overflow-y: auto;
  border: 1px solid rgba(83, 98, 124, 0.07);

  div {
    cursor: pointer;
    margin-bottom: 10px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const MessageWrapper = styled.div`
  margin-bottom: 16px;
  width: 100%;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }

  textarea {
    width: 100%;
    height: 205px;
    background: #f8f8f9;
    border-radius: 8px;
    resize: none;
    border: none;
    padding: 8px 12px;
  }
`;

export const SubmitButton = styled.button`
  padding: 13px;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  width: 100%;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
`;

export const ButtonWrapper = styled.button`
  position: absolute;
  right: 10px;
  top: 10px;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.7;
  }
  &:active {
    opacity: 0.5;
  }
`;
