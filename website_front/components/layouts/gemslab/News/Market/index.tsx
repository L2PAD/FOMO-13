import React, { useState } from "react";
import Link from "next/link";
import NewsItem from "../../../../global/NewsItem";
import CommentBlock from "../../../../global/CommentBlock";
import Pagination from "../../../../global/Pagintaion";
import { NewsWrapper, PageDescription, PageDescriptionWrapper } from "./styles";

const Market = () => {
  const [page, setPage] = useState(1);
  return (
    <div>
      <PageDescriptionWrapper>
        <PageDescription variant="p">
          Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
          sint. Velit officia consequat duis enim velit mollit. Exercitation
          veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
          ullamco est sit aliqua dolor do amet sint. Velit officia consequat
          duis enim velit mollit.
        </PageDescription>
      </PageDescriptionWrapper>
      <NewsWrapper>
        {Array(6)
          .fill("")
          .map((item, i) => {
            return (
              <Link href="/gemslab/news/234" key={i}>
                <NewsItem />
              </Link>
            );
          })}
        <Pagination
          page={page}
          total={20}
          limit={50}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </NewsWrapper>
      <CommentBlock />
    </div>
  );
};

export default Market;
