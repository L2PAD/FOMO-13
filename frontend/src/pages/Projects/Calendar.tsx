import React from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import CalendarLayout from '../../components/layouts/calendar_layout';

const CalendarPage = () => {
    return (
        <Layout>
            <CalendarLayout page={'crypto'}/>
        </Layout>
    );
};

export default CalendarPage;