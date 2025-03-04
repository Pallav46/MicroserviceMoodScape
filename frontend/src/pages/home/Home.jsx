import Sidebar from "../../components/sidebar/Sidebar"

function Home() {

  return (
    <div className="home_container w-full grid" style={{ gridTemplateColumns: "1fr 4fr 2fr", background: "linear-gradient(#050505, #18181d)" }}>
      <Sidebar/>
    </div>
  )
}

export default Home
