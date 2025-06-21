
import Home from './pages/Home';
import Features from './pages/Features';
import Navbar from './components/Navbar';
import Services from './pages/Services';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <Navbar />
      <Home/>
      <Features/>
      <Services/>
      <AboutUs/>
      <Contact/>
      <Footer/>
    </>
  );
}

export default App;