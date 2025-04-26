import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { MenuProvider } from './contexts/MenuContext';
import './App.css';
import AppRoutes from './Routes';

function App() {
  return (
    <Router>
      <MenuProvider>
        <AppRoutes />
      </MenuProvider>
    </Router>
  );
}

export default App;
