import { Children, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Home from './pages/Home.jsx';
import Features from './pages/Features.jsx';
import Services from './pages/Services.jsx';
import GetStarted from './pages/GetStarted.jsx';
import AboutUs from './pages/AboutUs.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';

const router = createBrowserRouter([
  {path: '/', element: <App />,
  children: [
    {index: true, element: <Home />},
    { path: 'features', element: <Features /> },
    { path: 'services', element: <Services /> },
    { path: 'get-started', element: <GetStarted /> },
    { path: 'about', element: <AboutUs /> },
    { path: 'contact', element: <Contact /> },
    { path: 'login', element: <Login /> },
  ],
  }   
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
