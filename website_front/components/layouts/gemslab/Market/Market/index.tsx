import React, { useState } from "react";
import Pagination from "../../../../global/Pagintaion";
import { SocialsWrapper, SocialButton, FlexWrapper, ShowAll } from "../styles";
import Typography from "../../../../global/common/Typography";
import { PageDescription } from "../../News/styles";
import {
  AddFavAction,
  DropdownWrapper,
  SubTabsFavWrapper,
} from "../../News/Parsing/styles";
import { OptionsForSortProjectsPage } from "../../../../../staticContent/global";
import NFTs from "../NFTs";
import CommentBlock from "../../../../global/CommentBlock";
import ListForSaleModal from "../../../projects/modals/ListForSaleModal";
import SaleIcon from "../../../../global/Icons/SaleIcon";
import Link from "next/link";
import ApproveCollectionModal from "../../../projects/modals/ApproveCollectionModal";

const Market = () => {
  const [page, setPage] = useState(1);
  const [activeSocial, setActiveSocial] = useState("All Projects");
  const [modal, setModal] = useState(false);
  const [approveCollectionModal, setApproveCollectionModal] = useState(false);
  const [sortValue, setSortValue] = useState(OptionsForSortProjectsPage[0]);

  const chooseSocial = (value: string) => {
    setActiveSocial(value);
  };

  return (
    <>
      <PageDescription variant="p">
        Find and buy an allocation in a project you are interested in.
      </PageDescription>
      <br />
      <FlexWrapper>
        <SocialsWrapper>
          <SocialButton
            active={activeSocial === "All Projects"}
            onClick={() => chooseSocial("All Projects")}
          >
            All Projects
          </SocialButton>
          <SocialButton
            active={activeSocial === "FOMO Key"}
            onClick={() => chooseSocial("FOMO Key")}
          >
            FOMO Key
          </SocialButton>
          <SocialButton
            active={activeSocial === "Early rounds"}
            onClick={() => chooseSocial("Early rounds")}
          >
            Early rounds
          </SocialButton>
          <SocialButton
            active={activeSocial === "Public rounds"}
            onClick={() => chooseSocial("Public rounds")}
          >
            Public rounds
          </SocialButton>
          <SocialButton
            active={activeSocial === "NFT Launch"}
            onClick={() => chooseSocial("NFT Launch")}
          >
            NFT Launch
          </SocialButton>
        </SocialsWrapper>
        <SubTabsFavWrapper>
          <AddFavAction onClick={() => setModal(true)}>
            + List for sale <SaleIcon />
          </AddFavAction>
        </SubTabsFavWrapper>
      </FlexWrapper>
      <br />
      <DropdownWrapper
        label="Sort by"
        onChange={setSortValue}
        value={sortValue}
        options={OptionsForSortProjectsPage}
      />
      <br />
      <Typography variant="h2">FOMO Key</Typography>
      <NFTs arrow />

      <ShowAll>
        <Link href="/utility/market/collection/123">Show all &gt;</Link>
      </ShowAll>
      <Typography variant="h2">Collection 2</Typography>
      <NFTs arrow />
      <ShowAll>
        <Link href="/utility/market/collection/123">Show all &gt;</Link>
      </ShowAll>
      <Typography variant="h2">Collection 3</Typography>
      <NFTs arrow />
      <ShowAll>
        <Link href="/utility/market/collection/123">Show all &gt;</Link>
      </ShowAll>
      <Typography variant="h2">Collection 4</Typography>
      <NFTs arrow />
      <ShowAll>
        <Link href="/utility/market/collection/123">Show all &gt;</Link>
      </ShowAll>
      <Typography variant="h2">Collection 6</Typography>
      <NFTs arrow />
      <ShowAll>
        <Link href="/utility/market/collection/123">Show all &gt;</Link>
      </ShowAll>
      <Pagination
        page={page}
        total={20}
        limit={50}
        totalPage={20}
        onChange={(value) => setPage(value)}
      />
      <CommentBlock />
      {modal && (
        <ListForSaleModal
          onClose={() => {
            setModal(false);
            setApproveCollectionModal(true);
          }}
        />
      )}
      {approveCollectionModal && (
        <ApproveCollectionModal
          onClose={() => setApproveCollectionModal(false)}
        />
      )}
    </>
  );
};

export default Market;
