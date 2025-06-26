import { useLocation } from "react-router-dom";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Outlet } from 'react-router-dom';

function App() {
  const location = useLocation();
  const hideNavOn = ["/dashboard"];

  return (
    <>
      {!hideNavOn.includes(location.pathname) && <Navbar />}
      <Outlet />
      <Footer />
    </>
  );
}

export default App;