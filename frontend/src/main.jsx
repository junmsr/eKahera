import { Children, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Home from './pages/Home.jsx';
import Features from './pages/Features.jsx';
import Services from './pages/Services.jsx';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';

const router = createBrowserRouter([
  {path: '/', element: <App />,
  children: [
    {index: true, element: <Home />},
      { path: '/features', element: <Features /> },
      { path: '/services', element: <Services /> },
    ],
  }   
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
