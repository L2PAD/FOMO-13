import React from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import UserLayout from '../../components/layouts/users_list_layout/user_layout';

const UserPage = () => {
    return (
        <Layout>
            <UserLayout />
        </Layout>
    );
};

export default UserPage;