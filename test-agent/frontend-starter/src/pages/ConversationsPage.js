// src/pages/ConversationsPage.js
import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useAppData } from '../context/AppDataContext';
import ConversationList from '../components/ConversationList';

const ConversationsPage = () => {
  const { conversations, loading, error } = useAppData();

  return (
    <Box>
      <Heading size="lg" mb={1}>Conversations</Heading>
      <Text color="gray.500" mb={6}>Every conversation between customers and AI agents</Text>
      <ConversationList
        conversations={conversations}
        loading={loading.conversations}
        error={error.conversations}
      />
    </Box>
  );
};

export default ConversationsPage;
