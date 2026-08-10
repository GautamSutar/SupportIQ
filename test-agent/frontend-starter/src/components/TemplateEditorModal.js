// src/components/TemplateEditorModal.js
// "Edit Template Screen" from Figma - name/title/category/content on the left, live preview on the right
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Flex,
  Box,
  Text,
  Input,
  Textarea,
  Select,
  HStack,
  VStack,
  Button,
  IconButton,
  Divider,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  FiCheck, FiCornerUpLeft, FiCornerUpRight, FiBold, FiItalic, FiUnderline,
  FiAlignLeft, FiAlignCenter, FiList, FiMessageCircle, FiMoreVertical,
} from 'react-icons/fi';
import { createTemplate, updateTemplate } from '../api';
import { renderTemplateSegments } from '../utils/templateUtils';

const CATEGORIES = ['Onboarding', 'Return', 'Engagement', 'Transaction'];

const SAMPLE_VALUES = {
  customer_name: 'Jim',
  company_name: 'RetailPlus',
  product_category: 'kitchen appliances',
  recommended_product: 'Eco-Friendly Blender',
  feature_name: 'order tracking',
  order_id: '48213',
  return_deadline: 'Aug 30',
  refund_amount: '$49.99',
};

const ToolbarButton = ({ icon, ...props }) => (
  <IconButton aria-label="format" icon={icon} size="xs" variant="ghost" {...props} />
);

const TemplateEditorModal = ({ isOpen, onClose, template, onSaved }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const panelBorder = useColorModeValue('gray.200', 'gray.600');
  const previewBg = useColorModeValue('gray.50', 'gray.700');
  const bubbleBg = useColorModeValue('white', 'gray.800');
  const varHighlight = useColorModeValue('brand.600', 'brand.400');

  useEffect(() => {
    if (!isOpen) return;
    setName(template?.name || '');
    setCategory(template?.category || CATEGORIES[0]);
    setContent(template?.content || '');
    setIsShared(template?.isShared || false);
  }, [isOpen, template]);

  const segments = renderTemplateSegments(content, SAMPLE_VALUES);

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      toast({ title: 'Name and content are required', status: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), category, content, isShared };
      const saved = template
        ? await updateTemplate(template.id, payload)
        : await createTemplate(payload);
      toast({ title: 'Template saved', status: 'success' });
      onSaved(saved);
    } catch (err) {
      toast({ title: 'Failed to save template', description: err.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent borderRadius="xl" overflow="hidden">
        <ModalBody p={0}>
          <Flex>
            <Box flex="1" p={5} borderRight="1px" borderColor={panelBorder}>
              <Text fontWeight="semibold" mb={4}>Edit Template</Text>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>Name</Text>
                  <Input size="sm" placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>Category</Text>
                  <Select size="sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Content <Text as="span" color="gray.400">(use {'{{variable_name}}'} for placeholders)</Text>
                  </Text>
                  <Textarea
                    rows={6}
                    size="sm"
                    placeholder="Hi {{customer_name}}! Welcome to {{company_name}}."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <HStack spacing={1} mt={1} p={1} borderRadius="md" bg={previewBg} wrap="wrap">
                    <ToolbarButton icon={<FiCornerUpLeft />} />
                    <ToolbarButton icon={<FiCornerUpRight />} />
                    <Divider orientation="vertical" h="16px" />
                    <ToolbarButton icon={<FiBold />} />
                    <ToolbarButton icon={<FiItalic />} />
                    <ToolbarButton icon={<FiUnderline />} />
                    <Divider orientation="vertical" h="16px" />
                    <ToolbarButton icon={<FiAlignLeft />} />
                    <ToolbarButton icon={<FiAlignCenter />} />
                    <ToolbarButton icon={<FiList />} />
                  </HStack>
                </Box>
              </VStack>

              <HStack justify="space-between" mt={6}>
                <Button
                  size="sm"
                  leftIcon={<FiCheck />}
                  variant={isShared ? 'solid' : 'outline'}
                  colorScheme="brand"
                  borderRadius="full"
                  onClick={() => setIsShared(v => !v)}
                >
                  Share with Team
                </Button>
                <HStack>
                  <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
                  <Button size="sm" colorScheme="brand" onClick={handleSave} isLoading={saving}>Save</Button>
                </HStack>
              </HStack>
            </Box>

            <Box flex="1" p={5} bg={previewBg}>
              <Text fontWeight="semibold" mb={4}>Preview</Text>
              <Box bg={bubbleBg} borderRadius="md" p={3} boxShadow="sm">
                <HStack align="start" spacing={2}>
                  <Box bg="rgba(194,31,61,.15)" color={varHighlight} borderRadius="full" p={1.5} fontSize="xs">
                    <FiMessageCircle />
                  </Box>
                  <Box flex="1" fontSize="sm">
                    {content ? (
                      segments.map((seg, i) =>
                        seg.isVariable ? (
                          <Text as="span" key={i} color={varHighlight} fontWeight="medium">{seg.text}</Text>
                        ) : (
                          <Text as="span" key={i}>{seg.text}</Text>
                        )
                      )
                    ) : (
                      <Text color="gray.400">Start typing to see a preview...</Text>
                    )}
                  </Box>
                  <FiMoreVertical color="gray" />
                </HStack>
              </Box>
              <Text fontSize="xs" color="gray.400" mt={2}>
                Highlighted text shows where customer/order details are automatically filled in.
              </Text>
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TemplateEditorModal;
