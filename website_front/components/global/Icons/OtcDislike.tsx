import React, { FC } from "react";
import Image from "next/image";
import DislikeIconDef from "../../../assets/icons/otc/dislike-default.svg";
import DislikeIconActive from "../../../assets/icons/otc/dislike-active.svg";

interface IProps {
  status: "default" | "active";
}

const OtcDisike: FC<IProps> = ({ status }) => {
  return status === "default" ? (
    <Image src={DislikeIconDef} alt="dislike" />
  ) : (
    <Image src={DislikeIconActive} alt="dislike" />
  );
};

export default OtcDisike;
