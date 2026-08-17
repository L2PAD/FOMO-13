import React from 'react';
import {Switch, useRouteMatch} from 'react-router';
import {Route} from 'react-router-dom';
import Projects from './Projects';
import News from './News';
import NewsPage from './News/NewsPage';
import NotFoundPage from '../NotFound';
import Project from './Project';
import NftPage from './NFTPage';
import MarketplacePage from './Marketplace';

const NFTSPages = () => {
    const {path} = useRouteMatch()

    return (
        <>
            <Switch>
                <Route exact path={`${path}/nft/:id`} component={NftPage} />
                <Route exact path={path} component={Projects} />
                <Route path={`${path}/project/:id`} component={Project} />
                <Route path={`${path}/news/:id`} component={NewsPage} />
                <Route path={`${path}/news`} component={News} />
                <Route path={`${path}/marketplace`} component={MarketplacePage} />
                <Route path="*" component={NotFoundPage} />
            </Switch>
        </>
    );
};

export default NFTSPages;
