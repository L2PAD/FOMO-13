import styled from "styled-components";
import React from "react";

export const BurgerButton = styled.button`
  display: none;
  flex-direction: column;
  justify-content: space-between;
  height: 36px;
  width: 36px;
  padding: 6px;
  z-index: 101;
  position: fixed;
  top: 5px;
  left: 5px;

  & ~ .burger-navigation {
    display: none;
  }

  @media (max-width: 768px) {
    display: flex;

    & ~ .burger-navigation {
      display: flex;

      &.open {
        box-shadow: 123px -12px 0px 400px rgba(0, 0, 0, 0.75);
        -webkit-box-shadow: 123px -12px 0px 400px rgba(0, 0, 0, 0.75);
        -moz-box-shadow: 123px -12px 0px 400px rgba(0, 0, 0, 0.75);
      }
    }
  }
`;
