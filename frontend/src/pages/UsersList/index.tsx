import React from 'react';
import {useRouteMatch} from 'react-router';
import {Route, Switch} from 'react-router-dom';
import UsersListPage from './UsersList';
import UsersListOTCPage from './UsersListOtc';
import DealsMarket from './DealsMarket';
import UserPage from './User';

const UsersListPages = () => {
    const {path} = useRouteMatch()

    return (
        <Switch>
            <Route exact path={path} component={UsersListPage} />
            <Route exact path={`${path}/otc`} component={DealsMarket} />
            <Route exact path={`${path}/otc-legacy`} component={UsersListOTCPage} />
            <Route path={`${path}/:id`} component={UserPage} />
            <Route path={`${path}/otc/:id`} component={UserPage} />
        </Switch>
    );
};

export default UsersListPages;