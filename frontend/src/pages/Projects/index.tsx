import React from 'react';
import {Switch, useRouteMatch} from 'react-router';
import {Route} from 'react-router-dom';
import Projects from './Projects';
import Calendar from './Calendar';
import News from './News';
import NotFoundPage from '../NotFound';
import ProjectPage from './Project';
import FundPage from './Fund/FundPage';
import NewsPage from './News/NewsPage';
import PersonPage from '../Person';
import OTCPage from './OTC';
import Funds from './Funds';
import Persons from './Persons';
import Ecosystem from './Ecosystem';
import FomoV2ReviewCasesPage from './FomoV2ReviewCases';
import FomoV2VestingReviewPage from './FomoV2VestingReview';

const ProjectsPage = () => {
    const {path} = useRouteMatch()

    return (
        <>
            <Switch>
                <Route exact path={`${path}/project/:id`} component={ProjectPage} />
                <Route exact path={`${path}/fund/:id`} component={FundPage} />
                <Route exact path={`${path}/person/:id`} component={PersonPage} />
                <Route exact path={path} component={Projects} />
                <Route path={`${path}/funds`} component={Funds} />
                <Route path={`${path}/persons`} component={Persons} />
                <Route path={`${path}/ecosystem`} component={Ecosystem} />
                <Route path={`${path}/fomo-v2/review-cases`} component={FomoV2ReviewCasesPage} />
                <Route path={`${path}/fomo-v2/vesting-review`} component={FomoV2VestingReviewPage} />
                <Route path={`${path}/otc`} component={OTCPage} />
                <Route path={`${path}/calendar`} component={Calendar} />
                <Route path={`${path}/news/:id`} component={NewsPage} />
                <Route path={`${path}/news`} component={News} />
                <Route path="*" component={NotFoundPage} />
            </Switch>
        </>
    );
};

export default ProjectsPage;
