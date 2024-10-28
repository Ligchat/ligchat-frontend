import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from 'antd';
import AppRoutes from './Routes'; // Importa as rotas
import './styles/tailwind.css'; // Importa Tailwind
import 'antd/dist/reset.css'; // Reseta o CSS do Ant Design
import './index.css';


const App: React.FC = () => {
  return (
    <Router>
      <Layout>
            <AppRoutes /> {/* Renderiza o componente de rotas */}
      </Layout>
    </Router>
  );
};

export default App;
