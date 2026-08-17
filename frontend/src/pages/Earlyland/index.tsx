import React from 'react';
import {Switch, useRouteMatch} from 'react-router';
import {Redirect, Route} from 'react-router-dom';
import NotFoundPage from '../NotFound';
import TaskPage from './TaskPage';
import ActivityEditorPage from './ActivityEditor';
import EarlyLandShell from './EarlyLandShell';

const EarlylandPages = () => {
    const {path} = useRouteMatch()

    return (
        <>
            <Switch>
                {/* Detail / editor pages render full-screen without the section tabs */}
                <Route path={`${path}/tasks/:id`} component={TaskPage} />
                <Route exact path={`${path}/activities/:id`} component={ActivityEditorPage} />
                {/* Legacy list route now lives inside the shell */}
                <Route exact path={`${path}/activities`}>
                    <Redirect to={path} />
                </Route>

                {/* Canonical EarlyLand section with internal tabs */}
                <Route exact path={`${path}/tasks`} render={() => <EarlyLandShell tab="tasks" />} />
                <Route exact path={`${path}/statistics`} render={() => <EarlyLandShell tab="statistics" />} />
                {/* P0: legacy /access (EarlyLand access settings) removed — access is
                    now managed globally in «Доступ и монетизация». Redirect for safety. */}
                <Route exact path={`${path}/access`}>
                    <Redirect to={path} />
                </Route>
                <Route exact path={`${path}/prime`} render={() => <EarlyLandShell tab="prime" />} />
                <Route exact path={path} render={() => <EarlyLandShell tab="all" />} />

                <Route path="*" component={NotFoundPage} />
            </Switch>
        </>
    );
};

export default EarlylandPages;
