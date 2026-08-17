import Layout from "../../components/layouts/main_layout/layout"
import Header from "../../components/layouts/persons_layouts/persons_list_layout/header"
import PersonsTable from "../../components/layouts/persons_layouts/persons_list_layout/person_table"

const Persons = () => {
  return (
    <Layout>
      <Header/>
      <PersonsTable/>
    </Layout>
  )
}

export default Persons
