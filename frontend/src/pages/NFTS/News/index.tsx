import React from 'react';
import Layout from '../../../components/layouts/main_layout/layout';
import NewsLayout from '../../../components/layouts/news_layout';


const NewsPage = () => {
    return (
        <Layout>
            <NewsLayout type='nfts'/>
        </Layout>
    );
};

export default NewsPage;