// src/pages/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  useColorModeValue,
  SimpleGrid,
  Button,
  Badge,
  HStack,
  Tooltip,
  Image,
} from '@chakra-ui/react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { useAppData } from '../context/AppDataContext';
import ConversationList from '../components/ConversationList';
import { formatMMSS } from '../utils/dateUtils';

const RANGE_MS = {
  today: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

const TABS = [
  { key: 'all', label: 'All Conversations' },
  { key: 'attention', label: 'Needs Attention', dot: true },
  { key: 'agents', label: 'Agent Performance' },
];

const StatCard = ({ children, h }) => {
  const bg = useColorModeValue('white', 'rgba(255,255,255,.04)');
  const border = useColorModeValue('gray.100', 'whiteAlpha.100');
  return (
    <Box
      bg={bg}
      backdropFilter={useColorModeValue('none', 'blur(16px)')}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      boxShadow={useColorModeValue('sm', '0 24px 48px -24px rgba(0,0,0,.6)')}
      p={5}
      h={h}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      transition="transform .3s cubic-bezier(.16,1,.3,1), border-color .3s"
      _hover={{ transform: 'translateY(-2px)', borderColor: 'brand.500' }}
    >
      {children}
    </Box>
  );
};

// Briefly highlights in the accent color whenever its value changes, so live
// (SSE-driven) metric updates are visibly noticeable, not just silently correct.
const LiveNumber = (props) => {
  const { value, ...rest } = props;
  const [flash, setFlash] = useState(false);
  const prevRef = React.useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <Text
      fontSize="3xl"
      fontWeight="bold"
      fontFamily="mono"
      sx={{ fontVariantNumeric: 'tabular-nums' }}
      color={flash ? 'brand.400' : undefined}
      transition="color .5s ease"
      {...rest}
    >
      {value}
    </Text>
  );
};

const TrendIcon = ({ direction }) => (
  <Flex
    w={8}
    h={8}
    borderRadius="full"
    align="center"
    justify="center"
    bg={direction === 'up' ? 'green.100' : 'red.100'}
    color={direction === 'up' ? 'green.500' : 'red.500'}
  >
    {direction === 'up' ? <FiArrowUp /> : <FiArrowDown />}
  </Flex>
);

const Dashboard = () => {
  const { conversations, agents, loading, error } = useAppData();
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState('all');

  const cardBg = useColorModeValue('white', 'surface.800');
  const agentCardBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  const scopedConversations = useMemo(() => {
    const cutoff = Date.now() - RANGE_MS[timeRange];
    return conversations.filter(conv => new Date(conv.startTime).getTime() >= cutoff);
  }, [conversations, timeRange]);

  const escalatedConversations = scopedConversations.filter(conv => conv.status === 'escalated').length;
  const highAlertConversations = scopedConversations.filter(conv => conv.alertLevel === 'high').length;
  const escalationRate = scopedConversations.length > 0
    ? Math.round((escalatedConversations / scopedConversations.length) * 100)
    : 0;

  const avgResponseTime = useMemo(() => {
    const withTiming = scopedConversations.filter(c => typeof c.metrics?.responseTime === 'number');
    if (withTiming.length === 0) return 0;
    return withTiming.reduce((sum, c) => sum + c.metrics.responseTime, 0) / withTiming.length;
  }, [scopedConversations]);

  const csatScore = useMemo(() => {
    const withSentiment = scopedConversations.filter(c => typeof c.metrics?.sentiment === 'number');
    if (withSentiment.length === 0) return 0;
    return (withSentiment.reduce((sum, c) => sum + c.metrics.sentiment, 0) / withSentiment.length) * 10;
  }, [scopedConversations]);

  const csatChartData = useMemo(() => {
    const withSentiment = scopedConversations.filter(c => typeof c.metrics?.sentiment === 'number');
    const points = withSentiment.slice(-4).map((c, i) => ({ name: `p${i}`, value: c.metrics.sentiment * 10 }));
    while (points.length < 4) points.unshift({ name: `pad${points.length}`, value: 0 });
    return points;
  }, [scopedConversations]);

  const activeConversationCount = scopedConversations.length;

  // Live metrics pushed every 2s over Server-Sent Events (backend: routes/analytics.js -> /stream)
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const source = new EventSource(`${apiUrl}/api/analytics/stream`);

    source.onopen = () => setLiveConnected(true);
    source.onmessage = (event) => {
      try {
        setLiveMetrics(JSON.parse(event.data));
      } catch (err) {
        console.error('Failed to parse SSE metrics payload:', err);
      }
    };
    source.onerror = () => setLiveConnected(false);

    return () => source.close();
  }, []);

  const displayActive = liveMetrics ? liveMetrics.active : activeConversationCount;
  const displayEscalationRate = liveMetrics ? liveMetrics.escalationRate : escalationRate;
  const displayAvgResponseTime = liveMetrics ? liveMetrics.avgResponseTime : avgResponseTime;
  const displayCsat = liveMetrics ? liveMetrics.csat : csatScore;

  return (
    <Box>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        gap={3}
        mb={6}
      >
        <Box>
          <HStack spacing={3} mb={1}>
            <Image src="/assets/supportiq-logo.png" alt="SupportIQ" h="64px" objectFit="contain" />
            <Heading size="lg">Agent Supervisor Dashboard</Heading>
            <Tooltip label={liveConnected ? 'Live metrics connected (SSE)' : 'Connecting...'}>
              <Box w={2} h={2} borderRadius="full" bg={liveConnected ? 'green.400' : 'gray.300'} />
            </Tooltip>
          </HStack>
          <Text color="gray.500">Monitor and manage AI agent interactions</Text>
        </Box>

        <Flex gap={2} wrap="wrap">
          <Button size="sm" borderRadius="full" variant={timeRange === 'today' ? 'solid' : 'outline'} onClick={() => setTimeRange('today')}>Today</Button>
          <Button size="sm" borderRadius="full" variant={timeRange === 'week' ? 'solid' : 'outline'} onClick={() => setTimeRange('week')}>This Week</Button>
          <Button size="sm" borderRadius="full" variant={timeRange === 'month' ? 'solid' : 'outline'} onClick={() => setTimeRange('month')}>This Month</Button>
        </Flex>
      </Flex>

      <Grid
        templateColumns={{ base: '1fr', md: '1.2fr 1fr 1fr' }}
        templateRows={{ base: 'auto', md: 'repeat(2, 1fr)' }}
        gap={4}
        mb={6}
      >
        <GridItem rowSpan={{ base: 1, md: 2 }}>
          <StatCard h="100%">
            <Flex justify="space-between" align="start" mb={2}>
              <Text fontWeight="semibold">Customer Satisfaction Score (CSAT)</Text>
              <Text fontSize="xs" color="gray.400">Today</Text>
            </Flex>
            <Flex align="flex-end" gap={4} flex="1">
              <Box h="90px" flex="1" minW="0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={csatChartData} barCategoryGap="30%">
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {csatChartData.map((entry, index) => (
                        <Cell key={index} fill={index === csatChartData.length - 1 ? '#e9435f' : 'rgba(233,67,95,.25)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <LiveNumber value={displayCsat.toFixed(1)} fontSize="2xl" pb={2} />
            </Flex>
          </StatCard>
        </GridItem>

        <GridItem rowSpan={{ base: 1, md: 2 }}>
          <StatCard h="100%">
            <Text fontWeight="semibold" mb={4}>Avg. Response Time</Text>
            <Flex justify="space-between" align="center">
              <LiveNumber value={formatMMSS(displayAvgResponseTime)} />
              <TrendIcon direction="down" />
            </Flex>
          </StatCard>
        </GridItem>

        <GridItem>
          <StatCard>
            <Text fontWeight="semibold" mb={4}>Active Conversations</Text>
            <Flex justify="space-between" align="center">
              <LiveNumber value={displayActive} />
              <TrendIcon direction="up" />
            </Flex>
          </StatCard>
        </GridItem>

        <GridItem>
          <StatCard>
            <Text fontWeight="semibold" mb={4}>Escalation Rate</Text>
            <Flex justify="space-between" align="center">
              <LiveNumber value={`${displayEscalationRate}%`} />
              <TrendIcon direction="down" />
            </Flex>
          </StatCard>
        </GridItem>
      </Grid>

      <Box bg={cardBg} borderRadius="xl" boxShadow="sm" p={4}>
        <Flex gap={2} mb={4} wrap="wrap">
          {TABS.map(tab => (
            <Button
              key={tab.key}
              size="sm"
              borderRadius="full"
              variant={activeTab === tab.key ? 'solid' : 'ghost'}
              colorScheme={activeTab === tab.key ? 'brand' : 'gray'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.dot && highAlertConversations > 0 && (
                <Badge as="span" w={2} h={2} borderRadius="full" bg="red.400" mr={2} p={0} />
              )}
              {tab.label}
            </Button>
          ))}
        </Flex>

        {activeTab === 'agents' ? (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {agents.map(agent => (
              <Box key={agent.id} bg={agentCardBg} p={4} borderRadius="lg">
                <Flex justify="space-between" align="center" mb={4}>
                  <Flex align="center">
                    <Box w={3} h={3} borderRadius="full" bg={agent.status === 'active' ? 'green.400' : 'gray.400'} mr={3} />
                    <Heading size="md">{agent.name}</Heading>
                  </Flex>
                  <Text fontSize="sm" color="gray.500">{agent.model}</Text>
                </Flex>
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Conversations</Text>
                    <Text fontWeight="bold" fontSize="xl">{agent.metrics?.conversations || 0}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Avg Response Time</Text>
                    <Text fontWeight="bold" fontSize="xl">{agent.metrics?.avgResponseTime || 0}s</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Satisfaction</Text>
                    <Text fontWeight="bold" fontSize="xl">{agent.metrics?.satisfaction ? `${Math.round(agent.metrics.satisfaction * 100)}%` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Escalation Rate</Text>
                    <Text fontWeight="bold" fontSize="xl">{agent.metrics?.escalationRate ? `${Math.round(agent.metrics.escalationRate * 100)}%` : 'N/A'}</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <ConversationList
            conversations={activeTab === 'attention' ? scopedConversations.filter(c => c.alertLevel === 'high') : scopedConversations}
            loading={loading.conversations}
            error={error.conversations}
          />
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
