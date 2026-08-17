import styled from "styled-components";

export const Container = styled.div`
  width: 300px;
  position: fixed;
  left: 20px;
  bottom: 10px;
  background: #f2fcfa;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 3;
`;

export const Link = styled.a`
  text-decoration-line: underline;
  color: var(--color-primary);
`;

export const Close = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
`;
