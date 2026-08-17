import React from 'react';
import Layout from '../../../components/layouts/main_layout/layout';
import NewsPageLayout from '../../../components/layouts/news_layout/news_page';

const NewsPage = () => {
    return (
        <Layout>
            <NewsPageLayout type='nfts'/>
        </Layout>
    );
};

export default NewsPage;