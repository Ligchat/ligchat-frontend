import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-screen">

      <div className="not-found-content">
        <div className="not-found-card">
          <div className="not-found-illustration">
            <div className="not-found-title">
              <h1>404 - Página não encontrada</h1>
              <p>Ops! Parece que você se perdeu.</p>
            </div>
            <div className="not-found-message">
              <h2>A página que você está procurando não existe</h2>
              <p>
                Verifique se o endereço foi digitado corretamente ou retorne para o dashboard.
              </p>
            </div>
          </div>
          
          <div className="not-found-actions">
            <button 
              className="back-button"
              onClick={() => navigate('/dashboard')}
            >
              <FiArrowLeft size={20} />
              <span>Voltar para o Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 