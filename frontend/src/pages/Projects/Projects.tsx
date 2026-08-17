import React from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import ProjectTable from '../../components/layouts/projects_layouts/projects_list_layout/project_table';
import Header from '../../components/layouts/projects_layouts/projects_list_layout/header';

const ProjectsPage = () => {
    return (
        <Layout>
            <Header />
            <ProjectTable />
        </Layout>
    );
};

export default ProjectsPage;