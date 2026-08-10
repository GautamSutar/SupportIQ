// src/components/Sidebar.js
import React from 'react';
import {
  Box,
  VStack,
  Icon,
  useColorMode,
  Button,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiMessageCircle,
  FiBriefcase,
  FiZap,
  FiSettings,
} from 'react-icons/fi';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
  { name: 'Conversations', icon: FiMessageCircle, path: '/conversations' },
  { name: 'AI Agents', icon: FiBriefcase, path: '/agent-config' },
  { name: 'Templates', icon: FiZap, path: '/templates' },
];

const Sidebar = () => {
  const { colorMode } = useColorMode();
  const location = useLocation();

  const bgColor = colorMode === 'dark' ? 'surface.900' : 'white';
  const borderColor = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.200';
  const activeBg = colorMode === 'dark' ? 'rgba(194,31,61,.12)' : 'brand.50';
  const activeColor = colorMode === 'dark' ? 'brand.400' : 'brand.500';
  const idleColor = colorMode === 'dark' ? 'whiteAlpha.700' : 'gray.600';
  const hoverBg = colorMode === 'dark' ? 'rgba(255,255,255,.06)' : 'gray.100';

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      w="250px"
      flexShrink={0}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
      justifyContent="space-between"
      py={5}
      px={3}
      minH="calc(100vh - 56px)"
    >
      <VStack spacing={1} align="stretch">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.path}
            as={Link}
            to={item.path}
            variant="ghost"
            justifyContent="flex-start"
            py={3}
            pl={4}
            leftIcon={<Icon as={item.icon} boxSize={5} />}
            bg={isActive(item.path) ? activeBg : 'transparent'}
            color={isActive(item.path) ? activeColor : idleColor}
            borderRadius="md"
            borderLeft="2px solid"
            borderLeftColor={isActive(item.path) ? 'brand.500' : 'transparent'}
            _hover={{
              bg: activeBg,
              color: activeColor,
            }}
          >
            {item.name}
          </Button>
        ))}
      </VStack>

      <Button
        variant="ghost"
        justifyContent="flex-start"
        py={3}
        pl={4}
        leftIcon={<Icon as={FiSettings} boxSize={5} />}
        color={idleColor}
        borderRadius="md"
        _hover={{ bg: hoverBg }}
      >
        Settings
      </Button>
    </Box>
  );
};

export default Sidebar;
