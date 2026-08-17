import CheckIcon from "./check_icon";
import styled from "styled-components";

const Wrapper = styled.div`
    svg{
        width: 24px;
        height: auto;
    }
`

const VerificationIcon = () => {
  return (
    <Wrapper>
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.8761 21.464L22.6081 12.732L21.0761 11.2L13.8761 18.349L11.0671 15.54L9.53509 17.072L13.8761 21.464ZM16.0711 4L25.8751 8.392V14.928C25.8751 20.954 21.6881 26.622 16.0711 28C10.4541 26.621 6.26709 20.953 6.26709 14.928V8.392L16.0711 4Z" fill="#00C099"/>
    </svg>
    </Wrapper>
  )
}

export default VerificationIcon

