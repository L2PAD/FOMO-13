import styled, { css } from "styled-components"
import { Button } from "../common/Button"

export const ModalCard = styled.div`
  background: var(--color-white);
  border-radius: 16px;
  width: 100%;
  max-width: 384px;
`

export const LogoWrapper = styled.div`
    max-width: fit-content;
    margin:0 auto;
`

export const Column = styled.div<{ gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ gap = 16 }) => gap}px;

  label {
    font-size: 14px;
    color: var(--main-gray);
  }

  strong {
    text-align: center;
  }
`

export const Center = styled.div`
  text-align: center;
`

export const Title = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-strong);

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`

export const Subtitle = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
`

export const MutedButton = styled.button`
  background: none;
  border: none;
  padding: 8px 0;
  font-size: 14px;
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover {
    color: var(--main-gray);
  }
`

export const ErrorText = styled.p`
  font-size: 14px;
  color: #ef4444;
  text-align: center;
`

export const InviteInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  text-align: center;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.15em;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  outline: none;

  &::placeholder {
    opacity: 0.5;
    font-weight: var(--font-weight-regular);
  }

  &:focus {
    border-color: var(--main-green);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  }
`

export const PrimaryButton = styled(Button) <{ disabled?: boolean }>`
  ${({ disabled }) =>
        disabled &&
        css`
      opacity: 0.5;
      cursor: not-allowed;
    `}
`

export const StepWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 24px 0;
`

export const StepCircle = styled.div<{ active?: boolean; completed?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ completed }) =>
        completed
            ? css`
          background: var(--main-green);
          color: var(--color-white);
        `
            : css`
          background: #f3f4f6;
          color: #9ca3af;
        `}

  ${({ active }) =>
        active &&
        css`
      box-shadow: 0 0 0 1px var(--main-green);
    `}
`

export const StepLine = styled.div<{ completed?: boolean }>`
  width: 32px;
  height: 2px;
  background: ${({ completed }) =>
        completed ? 'var(--main-green)' : '#e5e7eb'};
`

export const ConfirmWrapper = styled.div`
    display: flex;
    gap: 4px;

    p{
        font-size: 14px;
        color: var(--color-text-muted);
        a{
            color: var(--main-green);
            font-size: 14px;
            text-decoration: underline;
        }
    }
`