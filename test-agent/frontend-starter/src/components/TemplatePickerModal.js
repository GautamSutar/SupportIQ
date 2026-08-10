// src/components/TemplatePickerModal.js
// "Response Templates" picker used from the conversation composer (Figma: Conversation Screen - Template)
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Flex,
  Box,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Tabs,
  TabList,
  Tab,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { getTemplates } from '../api';
import { renderTemplateSegments, extractVariableNames } from '../utils/templateUtils';

const CATEGORIES = ['All', 'Onboarding', 'Return', 'Engagement', 'Transaction'];

const TemplatePickerModal = ({ isOpen, onClose, onInsert, autoValues = {} }) => {
  const [templates, setTemplates] = useState([]);
  const [scope, setScope] = useState('mine'); // mine | shared
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [overrides, setOverrides] = useState({});

  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const selectedBorder = useColorModeValue('brand.400', 'brand.300');
  const previewBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (!isOpen) return;
    getTemplates({ isShared: scope === 'shared' ? true : undefined })
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [isOpen, scope]);

  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setOverrides({});
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchesCategory = category === 'All' || t.category === category;
      const matchesSearch = search === '' || t.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, category, search]);

  const values = { ...autoValues, ...overrides };
  const segments = selected ? renderTemplateSegments(selected.content, values) : [];
  const missingVars = selected
    ? extractVariableNames(selected.content).filter(name => !values[name])
    : [];

  const handleInsert = () => {
    if (!selected) return;
    const rendered = segments.map(s => s.text).join('');
    onInsert(rendered);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader pb={2}>Response Templates</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex gap={4}>
            <Box w="180px" flexShrink={0}>
              <InputGroup size="sm" mb={3}>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray" />
                </InputLeftElement>
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
              <Tabs size="sm" index={scope === 'mine' ? 0 : 1} onChange={(i) => setScope(i === 0 ? 'mine' : 'shared')} mb={3}>
                <TabList>
                  <Tab>My Templates</Tab>
                  <Tab>Shared Templates</Tab>
                </TabList>
              </Tabs>

              <SimpleTemplateGrid
                templates={filtered}
                selected={selected}
                onSelect={setSelected}
                cardBorder={cardBorder}
                selectedBorder={selectedBorder}
              />
            </Box>

            <Box w="240px" flexShrink={0} borderLeft="1px" borderColor={cardBorder} pl={4}>
              <Text fontWeight="semibold" mb={2}>Preview</Text>
              {selected ? (
                <VStack align="stretch" spacing={3}>
                  <Box bg={previewBg} p={3} borderRadius="md" fontSize="sm">
                    {segments.map((seg, i) =>
                      seg.isVariable ? (
                        <Text
                          as="span"
                          key={i}
                          bg={seg.resolved ? 'yellow.200' : 'red.100'}
                          color="gray.800"
                          px="2px"
                          borderRadius="2px"
                          title={seg.resolved ? `Auto-filled: ${seg.name}` : `Needs value: ${seg.name}`}
                        >
                          {seg.text}
                        </Text>
                      ) : (
                        <Text as="span" key={i}>{seg.text}</Text>
                      )
                    )}
                  </Box>

                  {missingVars.length > 0 && (
                    <VStack align="stretch" spacing={2}>
                      <Text fontSize="xs" color="gray.500">Fill in missing variables:</Text>
                      {missingVars.map(name => (
                        <Input
                          key={name}
                          size="sm"
                          placeholder={name}
                          value={overrides[name] || ''}
                          onChange={(e) => setOverrides(prev => ({ ...prev, [name]: e.target.value }))}
                        />
                      ))}
                    </VStack>
                  )}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.400">Select a template to preview it here.</Text>
              )}
            </Box>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button colorScheme="brand" onClick={handleInsert} isDisabled={!selected}>Insert</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SimpleTemplateGrid = ({ templates, selected, onSelect, cardBorder, selectedBorder }) => {
  if (templates.length === 0) {
    return <Text fontSize="sm" color="gray.400">No templates found.</Text>;
  }

  return (
    <Flex wrap="wrap" gap={3} maxH="320px" overflowY="auto">
      {templates.map(t => (
        <Box
          key={t.id}
          w="calc(50% - 6px)"
          border="1px"
          borderColor={selected?.id === t.id ? selectedBorder : cardBorder}
          borderWidth={selected?.id === t.id ? '2px' : '1px'}
          borderRadius="md"
          p={3}
          cursor="pointer"
          onClick={() => onSelect(t)}
          _hover={{ borderColor: selectedBorder }}
        >
          <Text fontSize="sm" fontWeight="medium" noOfLines={2}>{t.name}</Text>
          <Text fontSize="xs" color="gray.500" mt={1} noOfLines={1}>{t.category}</Text>
        </Box>
      ))}
    </Flex>
  );
};

export default TemplatePickerModal;
