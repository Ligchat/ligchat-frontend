import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './Routes'; // Importa as rotas
import './styles/tailwind.css'; // Importa Tailwind
import './index.css';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { MenuProvider } from './contexts/MenuContext';

const App: React.FC = () => {
  return (
    <Router>
      <WebSocketProvider>
        <MenuProvider>
          <div className="min-h-screen">
            <AppRoutes /> {/* Renderiza o componente de rotas */}
          </div>
        </MenuProvider>
      </WebSocketProvider>
    </Router>
  );
};

export default App;
