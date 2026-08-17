import React, { useContext } from "react";
import Navigation from "../../components/global/Navigation";
import {
  EarlylandLogoutPages,
  EarlylandPages,
} from "../../staticContent/earlyland";
import Layout, { AuthContext } from "../../components/global/Layout";
import MyTasks from "../../components/layouts/earlyland/MyTasks";
import PageNotReady from "../../components/global/PageNotReady";

// Auth is resolved by Layout via getUserByToken (React Query) and exposed through
// AuthContext. The legacy Redux `authState.isLogin` flag is never dispatched, so
// we consume the canonical AuthContext here.
const TasksInner: React.FC = () => {
  const auth = useContext(AuthContext);
  const isLogin = !!auth?.isAuth;

  return (
    <>
      <Navigation
        project="earlyland"
        pagesList={isLogin ? EarlylandPages : EarlylandLogoutPages}
      />
      {isLogin ? <MyTasks /> : <PageNotReady />}
    </>
  );
};

const TasksPage = () => {
  return (
    <Layout title="Fomoland: My Tasks">
      <TasksInner />
    </Layout>
  );
};

export default TasksPage;
