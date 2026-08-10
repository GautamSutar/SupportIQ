// src/App.js
import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import theme from './theme';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AgentConfig from './pages/AgentConfig';
import ConversationView from './pages/ConversationView';
import ConversationsPage from './pages/ConversationsPage';
import Templates from './pages/Templates';
import { WebSocketProvider } from './context/WebSocketContext';
import { AppDataProvider } from './context/AppDataContext';

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/conversations" element={<ConversationsPage />} />
      <Route path="/conversation/:id" element={<ConversationView />} />
      <Route path="/agent-config" element={<AgentConfig />} />
      <Route path="/templates" element={<Templates />} />
    </Routes>
  </Layout>
);

function App() {
  return (
    <ChakraProvider theme={theme}>
      <WebSocketProvider>
        <AppDataProvider>
          <Router>
            <Box minHeight="100vh">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/*" element={<AppRoutes />} />
              </Routes>
            </Box>
          </Router>
        </AppDataProvider>
      </WebSocketProvider>
    </ChakraProvider>
  );
}

export default App;
