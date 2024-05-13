import { Route } from "react-router-dom";

import { Home } from "./pages/Home";
import Swap from "./pages/Swap";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <>
        <Header/>
        <Route exact strict path="/" component={Home} />
        <Route exact strict path="/swap/:address?" component={Swap} />
        <Footer/>
    </>
  );
}

export default App;
