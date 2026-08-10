// src/pages/Templates.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  SimpleGrid,
  Tabs,
  TabList,
  Tab,
  Button,
  IconButton,
  Tag,
  useColorModeValue,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiMessageCircle, FiArrowRight, FiHash, FiCalendar } from 'react-icons/fi';
import { getTemplates, deleteTemplate } from '../api';
import TemplateEditorModal from '../components/TemplateEditorModal';

const CATEGORIES = ['All', 'Popular', 'Onboarding', 'Return', 'Engagement', 'Transaction'];

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [category, setCategory] = useState('Onboarding');
  const [scope, setScope] = useState('mine');
  const [search, setSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const previewBg = useColorModeValue('gray.50', 'gray.700');

  const load = async () => {
    try {
      const data = await getTemplates({ isShared: scope === 'shared' ? true : undefined });
      setTemplates(data);
    } catch (err) {
      toast({ title: 'Failed to load templates', status: 'error' });
    }
  };

  useEffect(() => { load(); }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchesCategory = category === 'All' || category === 'Popular' || t.category === category;
      const matchesSearch = search === '' || t.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, category, search]);

  const handleCreate = () => {
    setEditingTemplate(null);
    onOpen();
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    onOpen();
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    try {
      await deleteTemplate(template.id);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      toast({ title: 'Template deleted', status: 'info' });
    } catch (err) {
      toast({ title: 'Failed to delete template', status: 'error' });
    }
  };

  const handleSaved = (saved) => {
    setTemplates(prev => {
      const exists = prev.some(t => t.id === saved.id);
      return exists ? prev.map(t => (t.id === saved.id ? saved : t)) : [saved, ...prev];
    });
    onClose();
  };

  return (
    <Box p={8} maxW="1100px" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Response Templates</Heading>
        <Button colorScheme="brand" leftIcon={<FiPlus />} onClick={handleCreate}>Create Template</Button>
      </Flex>

      <Flex gap={6}>
        <Box w="180px" flexShrink={0}>
          <InputGroup size="sm" mb={4}>
            <InputLeftElement pointerEvents="none"><FiSearch color="gray" /></InputLeftElement>
            <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </InputGroup>
          <VStack align="stretch" spacing={1}>
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={category === cat ? 'solid' : 'ghost'}
                colorScheme={category === cat ? 'brand' : 'gray'}
                justifyContent="flex-start"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </VStack>
        </Box>

        <Box flex="1">
          <Tabs size="sm" index={scope === 'mine' ? 0 : 1} onChange={(i) => setScope(i === 0 ? 'mine' : 'shared')} mb={4}>
            <TabList>
              <Tab>My Templates</Tab>
              <Tab>Shared Templates</Tab>
            </TabList>
          </Tabs>

          {filtered.length === 0 ? (
            <Text color="gray.400" fontSize="sm">No templates found.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {filtered.map(t => (
                <Box
                  key={t.id}
                  role="group"
                  bg={cardBg}
                  border="1px"
                  borderColor={cardBorder}
                  borderRadius="lg"
                  p={3}
                  position="relative"
                  _hover={{ borderColor: 'brand.300', boxShadow: 'sm' }}
                >
                  <Box bg={previewBg} borderRadius="md" p={2} mb={2} minH="48px">
                    <HStack spacing={1} mb={1}>
                      <Tag size="sm" colorScheme="brand" variant="subtle" borderRadius="full">
                        <FiMessageCircle size={10} style={{ marginRight: 4 }} /> Chat
                      </Tag>
                    </HStack>
                    <Text fontSize="xs" color="gray.500" noOfLines={2}>{t.content}</Text>
                  </Box>

                  <Text fontWeight="medium" fontSize="sm" mb={2} noOfLines={2}>{t.name}</Text>

                  <HStack spacing={2} mb={2}>
                    <Tag size="sm" variant="subtle" colorScheme="gray">
                      <FiHash size={10} style={{ marginRight: 4 }} /> {t.category}
                    </Tag>
                    <Tag size="sm" variant="subtle" colorScheme="gray">
                      <FiCalendar size={10} style={{ marginRight: 4 }} />
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </Tag>
                  </HStack>

                  <HStack
                    spacing={1}
                    opacity={0}
                    _groupHover={{ opacity: 1 }}
                    transition="opacity 0.15s"
                    position="absolute"
                    bottom="-14px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg={cardBg}
                    borderRadius="full"
                    boxShadow="md"
                    p={1}
                  >
                    <IconButton aria-label="Delete" icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" borderRadius="full" onClick={() => handleDelete(t)} />
                    <IconButton aria-label="Edit" icon={<FiEdit2 />} size="xs" variant="ghost" borderRadius="full" onClick={() => handleEdit(t)} />
                    <IconButton aria-label="Use template" icon={<FiArrowRight />} size="xs" colorScheme="green" variant="ghost" borderRadius="full" />
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Flex>

      <TemplateEditorModal
        isOpen={isOpen}
        onClose={onClose}
        template={editingTemplate}
        onSaved={handleSaved}
      />
    </Box>
  );
};

export default Templates;
