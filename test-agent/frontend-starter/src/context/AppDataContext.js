// src/context/AppDataContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getConversations,
  getAgents,
  getKnowledgeBases,
  addMessage as apiAddMessage,
  interveneInConversation as apiIntervene,
  releaseIntervention as apiRelease,
  updateConversationStatus as apiUpdateStatus,
  updateAgentConfig as apiUpdateAgentConfig,
} from '../api';
import { useWebSocket } from './WebSocketContext';

const AppDataContext = createContext(null);
export const useAppData = () => useContext(AppDataContext);

const matchesConversation = (conv, idOrDoc) => {
  const targetId = typeof idOrDoc === 'string' ? idOrDoc : (idOrDoc.id || idOrDoc._id);
  return conv.id === targetId || conv._id === targetId;
};

export const AppDataProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState({
    conversations: true,
    agents: true,
    knowledgeBases: true,
  });
  const [error, setError] = useState({
    conversations: null,
    agents: null,
    knowledgeBases: null,
  });

  const { lastMessage } = useWebSocket();

  const refreshConversations = useCallback(async (filters = {}) => {
    try {
      const conversationsData = await getConversations(filters);
      setConversations(conversationsData.data || []);
      setLoading(prev => ({ ...prev, conversations: false }));
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(prev => ({ ...prev, conversations: err.message }));
      setLoading(prev => ({ ...prev, conversations: false }));
    }
  }, []);

  const refreshAgents = useCallback(async () => {
    try {
      const agentsData = await getAgents();
      setAgents(agentsData || []);
      setLoading(prev => ({ ...prev, agents: false }));
    } catch (err) {
      console.error('Error loading agents:', err);
      setError(prev => ({ ...prev, agents: err.message }));
      setLoading(prev => ({ ...prev, agents: false }));
    }
  }, []);

  useEffect(() => {
    refreshConversations();
    refreshAgents();

    (async () => {
      try {
        const knowledgeBasesData = await getKnowledgeBases();
        setKnowledgeBases(knowledgeBasesData || []);
        setLoading(prev => ({ ...prev, knowledgeBases: false }));
      } catch (err) {
        console.error('Error loading knowledge bases:', err);
        setError(prev => ({ ...prev, knowledgeBases: err.message }));
        setLoading(prev => ({ ...prev, knowledgeBases: false }));
      }
    })();
  }, [refreshConversations, refreshAgents]);

  // Handle real-time updates pushed from MongoDB change streams (see backend/websocket/socketHandler.js)
  useEffect(() => {
    if (!lastMessage) return;

    try {
      switch (lastMessage.type) {
        case 'new_conversation':
          setConversations(prev =>
            prev.some(c => matchesConversation(c, lastMessage.data))
              ? prev
              : [lastMessage.data, ...prev]
          );
          break;

        case 'conversation_updated':
          setConversations(prev =>
            prev.map(conv =>
              matchesConversation(conv, lastMessage.data) ? { ...conv, ...lastMessage.data } : conv
            )
          );
          break;

        case 'agent_update':
          setAgents(prev =>
            prev.map(agent =>
              agent.id === lastMessage.agentId ? { ...agent, ...lastMessage.data } : agent
            )
          );
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
    }
  }, [lastMessage]);

  const updateConversation = (id, data) => {
    setConversations(prev =>
      prev.map(conv => (matchesConversation(conv, id) ? { ...conv, ...data } : conv))
    );
  };

  const updateAgent = (id, data) => {
    setAgents(prev =>
      prev.map(agent => (agent.id === id ? { ...agent, ...data } : agent))
    );
  };

  const takeOverConversation = async (conversationId, supervisorId = 'supervisor-1', notes = '') => {
    const result = await apiIntervene(conversationId, supervisorId, notes);
    updateConversation(conversationId, { humanIntervention: result.intervention, status: 'escalated' });
    return result;
  };

  const releaseConversation = async (conversationId, supervisorNotes = '') => {
    await apiRelease(conversationId, supervisorNotes);
    updateConversation(conversationId, {
      status: 'active',
      humanIntervention: { occurred: false },
      supervisorNotes,
    });
  };

  const sendSupervisorMessage = async (conversationId, text) => {
    const message = await apiAddMessage(conversationId, { sender: 'supervisor', text });
    setConversations(prev =>
      prev.map(conv =>
        matchesConversation(conv, conversationId)
          ? { ...conv, messages: [...(conv.messages || []), message] }
          : conv
      )
    );
    return message;
  };

  const markResolved = async (conversationId) => {
    await apiUpdateStatus(conversationId, 'resolved');
    updateConversation(conversationId, { status: 'resolved' });
  };

  const saveAgentConfig = async (agentId, config) => {
    const result = await apiUpdateAgentConfig(agentId, config);
    updateAgent(agentId, result.agent);
    return result;
  };

  return (
    <AppDataContext.Provider
      value={{
        conversations,
        agents,
        knowledgeBases,
        loading,
        error,
        updateConversation,
        updateAgent,
        refreshConversations,
        refreshAgents,
        takeOverConversation,
        releaseConversation,
        sendSupervisorMessage,
        markResolved,
        saveAgentConfig,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
