import Layout from "../../components/layouts/main_layout/layout"
import Header from "../../components/layouts/funds_layouts/funds_list_layout/header"
import FundsTable from "../../components/layouts/funds_layouts/funds_list_layout/fund_table"

const Funds = () => {
  return (
    <Layout> 
      <Header/>
      <FundsTable/>
    </Layout>
  )
}

export default Funds
