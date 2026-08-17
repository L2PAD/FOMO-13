import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { GemsLabPages } from "../../staticContent/gemslab";
import PrivatePortfolio from "../../components/layouts/gemslab/Portfolio/PrivatePortfolio";
import PrivatePortfolioSkeleton from "../../components/layouts/gemslab/Portfolio/PrivatePortfolioSkeleton";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { getSharedPortfolioByCode } from "../../http/portfolio";
import EmptyList from "../../components/global/EmptyList";
import { Button } from "../../components/global/common/Button";

const PrivatePortfolioPage = () => {
    const router = useRouter();
    const { id } = router.query;

    const { data, isLoading, isError, refetch } = useQuery(
        ["shared-portfolio", id],
        () => getSharedPortfolioByCode(id as string),
        {
            enabled: !!id,
            refetchOnWindowFocus: false
        }
    );
    
    return (
        <Layout title="FOMO: Portfolio">
            <Navigation project="portfolio" pagesList={GemsLabPages} />
            {isLoading ? (
                <PrivatePortfolioSkeleton />
            ) : isError || !data?.isSuccess ? (
                <div style={{ display: "grid", gap: 16, justifyItems: "center", padding: "48px 0" }}>
                    <EmptyList />
                    <Button variant="outlined" onClick={() => refetch()}>
                        Retry
                    </Button>
                </div>
            ) : (
                <PrivatePortfolio portfolio={data?.data} />
            )}
        </Layout>
    );
};
export default PrivatePortfolioPage;
