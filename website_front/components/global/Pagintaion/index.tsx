import React, { FC } from "react";
import ResponsivePagination from "react-responsive-pagination";
import "react-responsive-pagination/themes/minimal.css";
import Typography from "../common/Typography";
import { PaginationWrapper } from "./styles";

interface Props {
  page: number;
  total?: number;
  limit?: number;
  onePageLimit?: number;
  totalPage: number;
  onChange: (value: number) => void;
  style?: React.CSSProperties;
}

const Pagination: FC<Props> = ({
  page,
  total,
  limit,
  totalPage,
  onePageLimit = 100,
  onChange,
  style,
}) => {
  const getStartListNumber = (): number => {
    if (page === 1) return 1;

    if (page === totalPage) return onePageLimit * (totalPage - 1) + 1;

    return (page - 1) * (Number(limit) / Number(page)) + 1;
  };

  return (
    <PaginationWrapper style={style} className="pagination">
      <div>
        <ResponsivePagination
          previousLabel="<"
          nextLabel=">"
          current={page}
          total={totalPage}
          onPageChange={onChange}
        />
      </div>
      {limit && total && (
        <Typography className="showing-label" variant="p">
          <span className="showing">Showing</span> {getStartListNumber()} -{" "}
          {limit} out of {total || 0}
        </Typography>
      )}
    </PaginationWrapper>
  );
};

export default Pagination;
