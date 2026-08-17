import React, { FC, ReactNode, useState } from "react";
import Pagination from "../../../../global/Pagintaion";
import { Wrapper } from "./styles";

interface Props {
  onClose: () => void;
  children: ReactNode;
}

const SmartModal: FC<Props> = ({ onClose, children }) => {
  const [page, setPage] = useState(1);
  return (
    <Wrapper title="Top entities" variant="medium" onClose={onClose}>
      <br />
      {children}
      <Pagination
        page={page}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
    </Wrapper>
  );
};

export default SmartModal;
