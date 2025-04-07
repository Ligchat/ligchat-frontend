import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';  // Componente de Login
import MainLayout from './screens/MainLayout';    // Layout com o menu lateral
import HomeScreen from './screens/DashBoard';    // Componente do Dashboard
import MessageSchedule from './screens/MessageSchedule';
import LabelPage from './screens/LabelScreen';
import CRMPage from './screens/CRMPage';
import AccessPage from './screens/AccessPage';
import SectorsPage from './screens/SectorsPage';
import ProfilePage from './screens/ProfilePage';
import VariablesPage from './screens/VariablesPage';
import PrivacyPolicyPage from './screens/PrivacyPolicyPage';
import TermsOfUsePage from './screens/TermsOfUsePage';
import NotFoundPage from './screens/NotFoundPage';
import ChatNew from './screens/ChatNew';
import AgentsPage from './screens/AgentsPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rota de login sem o menu */}
      <Route path="/" element={<LoginScreen />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-use" element={<TermsOfUsePage />} />

      {/* Rotas que usam o MainLayout */}
      <Route element={<MainLayout />}>
        {/* Coloque aqui as rotas que terão o menu lateral */}
        <Route path="/dashboard" element={<HomeScreen />} />
        <Route path="/chat" element={<ChatNew />} />
        <Route path="/labels" element={<LabelPage/>}/>
        <Route path="/crm" element={<CRMPage/>}/>
        <Route path="/schedule" element={<MessageSchedule/>}/>
        <Route path="/access" element={<AccessPage/>}/>
        <Route path="/sectors" element={<SectorsPage/>}/>
        <Route path="/agents" element={<AgentsPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/flow/variable" element={<VariablesPage/>}/>
      </Route>

      {/* Rota 404 para páginas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
