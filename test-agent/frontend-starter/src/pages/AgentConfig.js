import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  VStack,
  Checkbox,
  HStack,
  Input,
  Tag,
  TagLabel,
  TagCloseButton,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useAppData } from '../context/AppDataContext';
import { savePreset, deletePreset } from '../api';

const buildFormState = (agent) => ({
  temperature: agent?.parameters?.temperature ?? 0.7,
  top_p: agent?.parameters?.top_p ?? 1,
  max_tokens: agent?.parameters?.max_tokens ?? 150,
  capabilities: (agent?.capabilities || []).map(c => ({ ...c })),
  knowledgeBases: (agent?.knowledgeBases || []).map(k => ({ ...k })),
  escalationThresholds: {
    lowConfidence: agent?.escalationThresholds?.lowConfidence ?? 0.4,
    negativeSentiment: agent?.escalationThresholds?.negativeSentiment ?? 0.3,
    responseTime: agent?.escalationThresholds?.responseTime ?? 20,
  },
});

const AgentConfig = () => {
  const { agents, saveAgentConfig, refreshAgents } = useAppData();
  const toast = useToast();

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [form, setForm] = useState(buildFormState(null));
  const [selectedPreset, setSelectedPreset] = useState('');
  const [saving, setSaving] = useState(false);

  const agent = agents.find(a => a.id === selectedAgentId);

  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (agent) {
      setForm(buildFormState(agent));
      setSelectedPreset('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id]);

  const toggleCapability = (capId) => {
    setForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.map(c => c.id === capId ? { ...c, enabled: !c.enabled } : c),
    }));
  };

  const toggleKnowledgeBase = (kbId) => {
    setForm(prev => ({
      ...prev,
      knowledgeBases: prev.knowledgeBases.map(k => k.id === kbId ? { ...k, enabled: !k.enabled } : k),
    }));
  };

  const handleReset = () => {
    setForm(buildFormState(agent));
    setSelectedPreset('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAgentConfig(selectedAgentId, {
        parameters: { temperature: form.temperature, top_p: form.top_p, max_tokens: form.max_tokens },
        capabilities: form.capabilities,
        knowledgeBases: form.knowledgeBases,
        escalationThresholds: form.escalationThresholds,
      });
      toast({ title: 'Configuration saved', status: 'success' });
    } catch (err) {
      toast({ title: 'Failed to save configuration', description: err.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = (name) => {
    setSelectedPreset(name);
    const preset = (agent?.presets || []).find(p => p.name === name);
    if (!preset) return;
    setForm({
      temperature: preset.parameters?.temperature ?? form.temperature,
      top_p: preset.parameters?.top_p ?? form.top_p,
      max_tokens: preset.parameters?.max_tokens ?? form.max_tokens,
      capabilities: form.capabilities.map(c => {
        const match = preset.capabilities?.find(p => p.id === c.id);
        return match ? { ...c, enabled: match.enabled } : c;
      }),
      knowledgeBases: form.knowledgeBases.map(k => {
        const match = preset.knowledgeBases?.find(p => p.id === k.id);
        return match ? { ...k, enabled: match.enabled } : k;
      }),
      escalationThresholds: preset.escalationThresholds || form.escalationThresholds,
    });
  };

  const handleSaveAsPreset = async () => {
    const name = window.prompt('Name this preset:');
    if (!name) return;
    try {
      await handleSave();
      await savePreset(selectedAgentId, name);
      await refreshAgents();
      toast({ title: `Preset "${name}" saved`, status: 'success' });
    } catch (err) {
      toast({ title: 'Failed to save preset', description: err.message, status: 'error' });
    }
  };

  const handleDeletePreset = async () => {
    if (!selectedPreset) return;
    try {
      await deletePreset(selectedAgentId, selectedPreset);
      await refreshAgents();
      setSelectedPreset('');
      toast({ title: 'Preset deleted', status: 'info' });
    } catch (err) {
      toast({ title: 'Failed to delete preset', status: 'error' });
    }
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!agent) {
    return <Box p={10}>Loading agents...</Box>;
  }

  return (
    <Box p={10} maxW="1000px" mx="auto">
      <Flex justify="space-between" align="center" mb={8}>
        <Heading fontSize="2xl">Configure your AI Agent</Heading>
        <HStack>
          <Button variant="outline" onClick={handleReset}>Reset</Button>
          <Button colorScheme="brand" onClick={handleSave} isLoading={saving}>Save Changes</Button>
        </HStack>
      </Flex>

      <Box bg={cardBg} p={8} borderRadius="xl" boxShadow="lg" border={`1px solid ${borderColor}`}>
        <Flex gap={4} mb={8} wrap="wrap">
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={2}>Agent</Text>
            <Select size="lg" value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)} maxW="300px">
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Box>

          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={2}>Preset</Text>
            <HStack>
              <Select size="lg" value={selectedPreset} onChange={(e) => handleApplyPreset(e.target.value)} maxW="220px">
                <option value="">Custom</option>
                {(agent.presets || []).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </Select>
              <Button size="sm" onClick={handleSaveAsPreset}>Save as Preset</Button>
              {selectedPreset && (
                <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDeletePreset}>Delete</Button>
              )}
            </HStack>
          </Box>
        </Flex>

        <Flex flexWrap="wrap" gap={8} mb={8}>
          <Box flex="1" minW="220px">
            <Text fontSize="md" mb={2}>Temperature</Text>
            <Slider value={form.temperature} onChange={(v) => setForm(prev => ({ ...prev, temperature: v }))} min={0} max={1} step={0.01}>
              <SliderTrack><SliderFilledTrack bg="brand.500" /></SliderTrack>
              <SliderThumb />
            </Slider>
            <Text fontSize="sm" color="gray.600" mt={1}>{form.temperature.toFixed(2)}</Text>
          </Box>

          <Box flex="1" minW="220px">
            <Text fontSize="md" mb={2}>Top-p</Text>
            <Slider value={form.top_p} onChange={(v) => setForm(prev => ({ ...prev, top_p: v }))} min={0} max={1} step={0.01}>
              <SliderTrack><SliderFilledTrack bg="brand.500" /></SliderTrack>
              <SliderThumb />
            </Slider>
            <Text fontSize="sm" color="gray.600" mt={1}>{form.top_p.toFixed(2)}</Text>
          </Box>

          <Box>
            <Text fontSize="md" mb={2}>Max Tokens</Text>
            <Input
              type="number"
              value={form.max_tokens}
              size="lg"
              onChange={(e) => setForm(prev => ({ ...prev, max_tokens: Number(e.target.value) }))}
              w="120px"
            />
          </Box>
        </Flex>

        <Box mb={8}>
          <Text fontSize="lg" fontWeight="semibold" mb={2}>Capabilities</Text>
          <HStack spacing={4} wrap="wrap">
            {form.capabilities.map((cap) => (
              <Tag
                size="lg"
                variant={cap.enabled ? 'solid' : 'outline'}
                colorScheme="brand"
                cursor="pointer"
                onClick={() => toggleCapability(cap.id)}
                key={cap.id}
              >
                <TagLabel>{cap.name}</TagLabel>
                {cap.enabled && <TagCloseButton />}
              </Tag>
            ))}
          </HStack>
        </Box>

        <Box mb={8}>
          <Text fontSize="lg" fontWeight="semibold" mb={2}>Knowledge Base Access</Text>
          <VStack align="start" spacing={3}>
            {form.knowledgeBases.map(kb => (
              <Checkbox key={kb.id} isChecked={kb.enabled} onChange={() => toggleKnowledgeBase(kb.id)}>
                {kb.name}
              </Checkbox>
            ))}
          </VStack>
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={2}>Escalation Thresholds</Text>
          <Flex gap={6} wrap="wrap" align="center">
            <Flex align="center" gap={2}>
              <Text>Escalate if confidence below</Text>
              <Input
                type="number" step={0.05} min={0} max={1} size="sm" width="80px"
                value={form.escalationThresholds.lowConfidence}
                onChange={(e) => setForm(prev => ({ ...prev, escalationThresholds: { ...prev.escalationThresholds, lowConfidence: Number(e.target.value) } }))}
              />
            </Flex>
            <Flex align="center" gap={2}>
              <Text>Escalate if sentiment below</Text>
              <Input
                type="number" step={0.05} min={0} max={1} size="sm" width="80px"
                value={form.escalationThresholds.negativeSentiment}
                onChange={(e) => setForm(prev => ({ ...prev, escalationThresholds: { ...prev.escalationThresholds, negativeSentiment: Number(e.target.value) } }))}
              />
            </Flex>
            <Flex align="center" gap={2}>
              <Text>Escalate if response time exceeds</Text>
              <Input
                type="number" min={0} size="sm" width="80px"
                value={form.escalationThresholds.responseTime}
                onChange={(e) => setForm(prev => ({ ...prev, escalationThresholds: { ...prev.escalationThresholds, responseTime: Number(e.target.value) } }))}
              />
              <Text>sec</Text>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default AgentConfig;
