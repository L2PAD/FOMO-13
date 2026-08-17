import React, { useContext, useState } from "react";
import logo from "../../../public/static/logo-beta.svg";
import { JoinWrapper } from "./styles";
import Image from "next/image";
import Link from "next/link";
import CooperationModal from "../modals/CooperationModal";
// import { AboutContext } from "../../../pages/about";

const Join = () => {
  // const { headerText } = useContext(AboutContext);
  const [cooperationModal, setCooperationModal] = useState(false);

  return (
    <JoinWrapper>
      <Image width={94 * 4} height={44 * 4} src={logo.src} alt="Logo" />
      <div className="links">
        <Link href="#about">About us</Link>
        <Link href="#portfolio">Portfolio</Link>
        <Link href="#partners">Partners</Link>
        <Link href="#progress">Progress</Link>
        <Link href="#contact">Contact</Link>
      </div>
      {/* <p>{headerText}</p> */}
      <div
        className="button"
        onClick={() => {
          setCooperationModal(true);
        }}
      >
        Join us
      </div>
      {cooperationModal && (
        <CooperationModal
          onClose={() => {
            setCooperationModal(false);
          }}
        />
      )}
    </JoinWrapper>
  );
};

export default Join;
