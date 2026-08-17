import React from 'react';
import TaskCenterPage from './TaskCenter';

// The Task Center replaces the legacy calendar-only tasks layout. The old
// component (components/layouts/tasks_layout) is kept in the codebase for
// backward compatibility but is no longer routed.
const TasksPage = () => <TaskCenterPage />;

export default TasksPage;
