import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';  // Componente de Login
import MainLayout from './screens/MainLayout';    // Layout com o menu lateral
import HomeScreen from './screens/DashBoard';    // Componente do Dashboard
import ChatPage from './screens/ChatScreen';
import MessageSchedule from './screens/MessageSchedule';
import LabelPage from './screens/LabelScreen';
import CRMPage from './screens/CRMPage';
import AccessPage from './screens/AccessPage';
import SectorsPage from './screens/SectorsPage';
import WebhookPage from './screens/WebhookPage';
import ProfilePage from './screens/ProfilePage';
import FlowPage from './screens/FlowPage';
import EditFlowPage from './screens/EditFlowPage';
import VariablesPage from './screens/VariablesPage';
import PrivacyPolicyPage from './screens/PrivacyPolicyPage';
import TermsOfUsePage from './screens/TermsOfUsePage';

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
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/labels" element={<LabelPage/>}/>
        <Route path="/crm" element={<CRMPage/>}/>
        <Route path="/message/schedule" element={<MessageSchedule/>}/>
        <Route path="/access" element={<AccessPage/>}/>
        <Route path="/sector" element={<SectorsPage/>}/>
        <Route path="/webhook" element={<WebhookPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/flow" element={<FlowPage/>}/>
        <Route path="/flow/variable" element={<VariablesPage/>}/>
        <Route path="/flow/edit/:id" element={<EditFlowPage flowId={''} />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
