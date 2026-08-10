// src/components/ConversationList.js
import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Avatar,
  HStack,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSearch, FiSliders, FiArrowUpRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../utils/dateUtils';

const STATUS_STYLES = {
  active: { bg: 'red.100', color: 'red.600' },
  waiting: { bg: 'yellow.100', color: 'yellow.700' },
  resolved: { bg: 'green.100', color: 'green.700' },
  escalated: { bg: 'blue.100', color: 'blue.700' },
};

const lastMessagePreview = (conversation) => {
  const messages = conversation.messages || [];
  const last = messages[messages.length - 1];
  return last?.text || 'No messages yet';
};

const lastActivityTime = (conversation) => {
  const messages = conversation.messages || [];
  const last = messages[messages.length - 1];
  return last?.timestamp || conversation.startTime;
};

const ConversationList = ({ conversations, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');

  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const matchesSearch = searchTerm === '' ||
        conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.tags && conv.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      const matchesAlert = alertFilter === 'all' || conv.alertLevel === alertFilter;

      return matchesSearch && matchesStatus && matchesAlert;
    });
  }, [conversations, searchTerm, statusFilter, alertFilter]);

  const handleConversationClick = (id) => {
    navigate(`/conversation/${id}`);
  };

  if (loading) {
    return <Box p={4}>Loading conversations...</Box>;
  }

  if (error) {
    return <Box p={4} color="red.500">Error loading conversations: {error}</Box>;
  }

  return (
    <Box bg={bg} borderRadius="lg" boxShadow="sm" overflow="hidden">
      <Flex justify="flex-end" gap={2} p={3}>
        <Popover>
          <PopoverTrigger>
            <IconButton aria-label="Filter conversations" icon={<FiSliders />} size="sm" variant="outline" borderRadius="full" />
          </PopoverTrigger>
          <Portal>
            <PopoverContent w="260px">
              <PopoverBody>
                <InputGroup size="sm" mb={2}>
                  <InputLeftElement pointerEvents="none"><FiSearch color="gray" /></InputLeftElement>
                  <Input placeholder="Search by name or tag" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </InputGroup>
                <HStack>
                  <Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                  </Select>
                  <Select size="sm" value={alertFilter} onChange={(e) => setAlertFilter(e.target.value)}>
                    <option value="all">All Alerts</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </HStack>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </Popover>
        <IconButton aria-label="Open full conversation list" icon={<FiArrowUpRight />} size="sm" variant="outline" borderRadius="full" />
      </Flex>

      {filteredConversations.length === 0 ? (
        <Box p={4} textAlign="center" color="gray.500">
          No conversations match your filters
        </Box>
      ) : (
        <Box overflowX="auto">
          <Box as="table" w="100%" fontSize="sm">
            <Box as="thead">
              <Box as="tr" color="gray.400" textTransform="uppercase" fontSize="xs">
                <Box as="th" textAlign="left" fontWeight="medium" py={2} px={4}>Name</Box>
                <Box as="th" textAlign="left" fontWeight="medium" py={2} px={4}>Message</Box>
                <Box as="th" textAlign="left" fontWeight="medium" py={2} px={4}>Status</Box>
                <Box as="th" textAlign="left" fontWeight="medium" py={2} px={4}>Time</Box>
              </Box>
            </Box>
            <Box as="tbody">
              {filteredConversations.map((conversation) => {
                const statusStyle = STATUS_STYLES[conversation.status] || STATUS_STYLES.active;
                return (
                  <Box
                    as="tr"
                    key={conversation.id}
                    borderTop="1px"
                    borderColor={borderColor}
                    _hover={{ bg: hoverBg, cursor: 'pointer' }}
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <Box as="td" py={3} px={4}>
                      <HStack>
                        <Avatar size="sm" name={conversation.customer.name} />
                        <Text fontWeight="medium">{conversation.customer.name}</Text>
                      </HStack>
                    </Box>
                    <Box as="td" py={3} px={4} maxW="280px">
                      <Text color="gray.500" noOfLines={1}>{lastMessagePreview(conversation)}</Text>
                    </Box>
                    <Box as="td" py={3} px={4}>
                      <Badge bg={statusStyle.bg} color={statusStyle.color} borderRadius="full" px={3} py={1} textTransform="capitalize">
                        {conversation.status}
                      </Badge>
                    </Box>
                    <Box as="td" py={3} px={4} color="gray.500">
                      {formatTime(lastActivityTime(conversation))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConversationList;
