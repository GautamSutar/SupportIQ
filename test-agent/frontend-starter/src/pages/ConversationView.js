// src/pages/ConversationView.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Avatar,
  Divider,
  Badge,
  Textarea,
  Input,
  IconButton,
  Tag,
  TagLabel,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiSend, FiPlus, FiMic, FiMicOff } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { addTags } from '../api';
import TemplatePickerModal from '../components/TemplatePickerModal';
import useSpeechRecognition from '../utils/useSpeechRecognition';

const ConversationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    conversations,
    takeOverConversation,
    releaseConversation,
    sendSupervisorMessage,
    markResolved,
    updateConversation,
  } = useAppData();

  const [messageText, setMessageText] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isTemplateOpen, setTemplateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const speech = useSpeechRecognition({
    onFinalResult: (transcript) => {
      if (!transcript) return;
      setMessageText(prev => (prev ? `${prev.trim()} ${transcript}` : transcript));
    },
    onError: (message) => {
      toast({ title: 'Voice input error', description: message, status: 'error', duration: 6000 });
    },
  });

  const conversation = useMemo(
    () => conversations.find(c => c.id === id || c._id === id),
    [conversations, id]
  );

  useEffect(() => {
    setReleaseNotes(conversation?.supervisorNotes || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  const chatBg = useColorModeValue('white', 'gray.800');
  const panelBg = useColorModeValue('gray.50', 'gray.900');
  const noteBg = useColorModeValue('yellow.100', 'yellow.700');
  const bubbleCustomer = useColorModeValue('gray.100', 'gray.700');
  const bubbleAgent = useColorModeValue('blue.50', 'blue.900');
  const bubbleSupervisor = useColorModeValue('brand.100', 'brand.800');

  if (!conversation) {
    return <Text p={4}>Loading conversation...</Text>;
  }

  const inControl = conversation.humanIntervention?.occurred;

  const handleTakeOver = async () => {
    setBusy(true);
    try {
      await takeOverConversation(conversation.id);
      toast({ title: 'You are now in control of this conversation', status: 'success' });
    } catch (err) {
      toast({ title: 'Failed to take over', description: err.message, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async () => {
    setBusy(true);
    try {
      await releaseConversation(conversation.id, releaseNotes);
      toast({ title: 'Control returned to AI agent', status: 'info' });
    } catch (err) {
      toast({ title: 'Failed to release', description: err.message, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    setBusy(true);
    try {
      await sendSupervisorMessage(conversation.id, messageText.trim());
      setMessageText('');
    } catch (err) {
      toast({ title: 'Failed to send message', description: err.message, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = async () => {
    setBusy(true);
    try {
      await markResolved(conversation.id);
      toast({ title: 'Conversation marked resolved', status: 'success' });
    } catch (err) {
      toast({ title: 'Failed to update status', description: err.message, status: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleAddTag = async () => {
    const tag = newTag.trim();
    if (!tag) return;
    setNewTag('');
    try {
      const result = await addTags(conversation.id, [tag]);
      updateConversation(conversation.id, { tags: result.tags });
    } catch (err) {
      toast({ title: 'Failed to add tag', status: 'error' });
    }
  };

  const durationMinutes = Math.max(
    0,
    Math.round(((conversation.endTime ? new Date(conversation.endTime) : new Date()) - new Date(conversation.startTime)) / 60000)
  );

  return (
    <Flex gap={4} h="calc(100vh - 100px)">
      {/* Conversation list */}
      <Box w="260px" flexShrink={0} bg={chatBg} borderRadius="xl" boxShadow="md" overflowY="auto">
        <Text fontWeight="bold" p={4} pb={2}>Customer Conversations</Text>
        <VStack align="stretch" spacing={0}>
          {conversations.map((c) => (
            <Box
              key={c.id || c._id}
              p={3}
              px={4}
              cursor="pointer"
              bg={c.id === conversation.id ? panelBg : 'transparent'}
              _hover={{ bg: panelBg }}
              onClick={() => navigate(`/conversation/${c.id}`)}
            >
              <HStack>
                <Avatar size="sm" name={c.customer?.name} />
                <Box flex="1" minW={0}>
                  <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{c.customer?.name}</Text>
                  <Badge
                    fontSize="10px"
                    colorScheme={
                      c.status === 'active' ? 'green' :
                      c.status === 'waiting' ? 'orange' :
                      c.status === 'resolved' ? 'blue' : 'purple'
                    }
                  >
                    {c.status}
                  </Badge>
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Chat */}
      <Box flex="2" bg={chatBg} borderRadius="xl" boxShadow="md" p={4} display="flex" flexDirection="column">
        <Flex justify="space-between" align="center" mb={3}>
          <HStack>
            <Avatar name={conversation.customer?.name} size="sm" />
            <Box>
              <Text fontWeight="bold">
                {conversation.customer?.name} <Text as="span" color="gray.500" fontWeight="normal">#{conversation.customer?.id}</Text>
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme={conversation.status === 'active' ? 'green' : conversation.status === 'escalated' ? 'purple' : 'gray'}>
                  {conversation.status}
                </Badge>
                <Text fontSize="xs" color="gray.500">{durationMinutes}m</Text>
              </HStack>
            </Box>
          </HStack>

          {inControl ? (
            <Badge colorScheme="brand" px={3} py={1} borderRadius="md">You're in control</Badge>
          ) : (
            <Button colorScheme="brand" size="sm" onClick={handleTakeOver} isLoading={busy}>
              Take Over
            </Button>
          )}
        </Flex>

        <VStack align="stretch" spacing={3} flex="1" overflowY="auto" py={2}>
          {(conversation.messages || []).map((msg, index) => {
            const isSupervisor = msg.sender === 'supervisor';
            const isAgent = msg.sender === 'agent';
            return (
              <Flex key={index} justify={isSupervisor ? 'flex-end' : 'flex-start'}>
                <Box
                  bg={isSupervisor ? bubbleSupervisor : isAgent ? bubbleAgent : bubbleCustomer}
                  p={3}
                  borderRadius="md"
                  maxWidth="75%"
                >
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
                    {isSupervisor ? 'YOU (SUPERVISOR)' : msg.sender.toUpperCase()}
                  </Text>
                  <Text>{msg.text}</Text>
                </Box>
              </Flex>
            );
          })}
        </VStack>

        <Divider my={3} />

        {inControl ? (
          <VStack align="stretch" spacing={1}>
            <HStack>
              <IconButton
                aria-label="Insert template"
                icon={<FiPlus />}
                size="sm"
                onClick={() => setTemplateOpen(true)}
              />
              <Input
                placeholder={speech.isListening ? 'Listening...' : 'Respond as supervisor...'}
                value={speech.isListening && speech.interimText ? `${messageText} ${speech.interimText}`.trim() : messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Tooltip label={speech.unsupportedReason || (speech.isListening ? 'Stop voice input' : 'Start voice input')}>
                <IconButton
                  aria-label={speech.isListening ? 'Stop voice input' : 'Start voice input'}
                  icon={speech.isListening ? <FiMicOff /> : <FiMic />}
                  size="sm"
                  colorScheme={speech.isListening ? 'red' : 'gray'}
                  variant={speech.isListening ? 'solid' : 'outline'}
                  isDisabled={!speech.isSupported}
                  onClick={speech.toggle}
                />
              </Tooltip>
              <IconButton
                aria-label="Send message"
                icon={<FiSend />}
                colorScheme="brand"
                onClick={handleSend}
                isLoading={busy}
              />
            </HStack>
            {speech.isListening && (
              <Text fontSize="xs" color="red.500">Listening — speak now, tap the mic again to stop.</Text>
            )}
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Take over the conversation to respond as a supervisor.
          </Text>
        )}
      </Box>

      {/* Customer details */}
      <Box w="280px" flexShrink={0} bg={chatBg} borderRadius="xl" boxShadow="md" p={4} overflowY="auto">
        <Text fontSize="lg" fontWeight="bold" mb={3}>Customer Details</Text>
        <HStack mb={3}>
          <Avatar name={conversation.customer?.name} />
          <Box>
            <Text fontWeight="medium">{conversation.customer?.name}</Text>
            <Text fontSize="sm" color="gray.500">#{conversation.customer?.id}</Text>
          </Box>
        </HStack>

        <Divider my={3} />

        <Text fontSize="sm" fontWeight="semibold" mb={1}>Conversation Info</Text>
        <VStack align="start" spacing={1} mb={3} fontSize="sm">
          <HStack><Badge colorScheme={conversation.status === 'active' ? 'green' : 'gray'}>{conversation.status}</Badge><Text color="gray.500">{durationMinutes}m elapsed</Text></HStack>
          <Text>Response time: {conversation.metrics?.responseTime?.toFixed?.(1) ?? conversation.metrics?.responseTime ?? '—'}s</Text>
          <Text>Confidence: {conversation.metrics?.confidenceScore ? `${Math.round(conversation.metrics.confidenceScore * 100)}%` : '—'}</Text>
          <Text>Sentiment: {conversation.metrics?.sentiment ? `${Math.round(conversation.metrics.sentiment * 100)}%` : '—'}</Text>
        </VStack>

        <Text fontSize="sm" fontWeight="semibold" mb={1}>Tags</Text>
        <Flex wrap="wrap" gap={2} mb={2}>
          {(conversation.tags || []).map(tag => (
            <Tag key={tag} size="sm" colorScheme="gray">
              <TagLabel>{tag}</TagLabel>
            </Tag>
          ))}
        </Flex>
        <HStack mb={4}>
          <Input
            size="sm"
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <IconButton aria-label="Add tag" icon={<FiPlus />} size="sm" onClick={handleAddTag} />
        </HStack>

        <Text fontSize="sm" fontWeight="semibold" mb={1}>Feedback Notes</Text>
        <Textarea
          bg={noteBg}
          size="sm"
          rows={4}
          placeholder="Notes for the AI agent when returning control..."
          value={releaseNotes}
          onChange={(e) => setReleaseNotes(e.target.value)}
          mb={4}
        />

        <VStack spacing={2} align="stretch">
          {inControl && (
            <Button colorScheme="brand" variant="outline" onClick={handleRelease} isLoading={busy}>
              Return to AI with Notes
            </Button>
          )}
          <Button colorScheme="green" onClick={handleResolve} isLoading={busy} isDisabled={conversation.status === 'resolved'}>
            Mark as Resolved
          </Button>
        </VStack>
      </Box>

      <TemplatePickerModal
        isOpen={isTemplateOpen}
        onClose={() => setTemplateOpen(false)}
        autoValues={{ customer_name: conversation.customer?.name, company_name: 'RetailPlus' }}
        onInsert={(text) => setMessageText(prev => (prev ? `${prev} ${text}` : text))}
      />
    </Flex>
  );
};

export default ConversationView;
