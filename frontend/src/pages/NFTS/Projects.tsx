import React from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import Header from '../../components/layouts/nfts_layouts/project_list_layout/header';
import ProjectTable from '../../components/layouts/nfts_layouts/project_list_layout/project_table';

const ProjectsPage = () => {
    return (
        <Layout>
            <Header />
            <ProjectTable />
        </Layout>
    );
};

export default ProjectsPage;