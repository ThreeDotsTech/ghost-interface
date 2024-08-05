import { Route } from "react-router-dom";
import Swap from "./pages/Swap";
import Footer from "./components/Footer";
import Header from "./components/Header";

function App() {
  return (
    <>  
        <Header/>
        <Route exact strict path="/:address?" component={Swap} />
        <Footer/>
    </>
  );
}

export default App;
