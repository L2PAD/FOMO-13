import React from "react";
import * as S from "../styles";

interface MakePaymentCopyIconProps {
  onClick: () => void;
}

const MakePaymentCopyIcon: React.FC<MakePaymentCopyIconProps> = ({ onClick }) => {
  return (
    <S.CopyIcon onClick={onClick}>
      <svg
        width="10"
        height="12"
        viewBox="0 0 10 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.16797 6.50003L9.16797 3.50003C9.16797 1.84317 7.8248 0.500016 6.16793 0.500036L3.31797 0.500069M5.7013 11.1667L1.8013 11.1667C1.08333 11.1667 0.501303 10.5697 0.501303 9.83334L0.501302 4.0556C0.501302 3.31923 1.08333 2.72228 1.8013 2.72228L5.7013 2.72227C6.41927 2.72227 7.0013 3.31922 7.0013 4.0556L7.0013 9.83334C7.0013 10.5697 6.41927 11.1667 5.7013 11.1667Z"
          stroke="#728094"
          stroke-linecap="round"
        />
      </svg>
    </S.CopyIcon>
  );
};

export default MakePaymentCopyIcon;
