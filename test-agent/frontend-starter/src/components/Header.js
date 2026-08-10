// src/components/Header.js
import React from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
  useColorMode,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  DrawerHeader,
  DrawerCloseButton,
  VStack,
  Button,
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiMoon, FiSun, FiUser, FiSettings, FiHelpCircle, FiMenu,
  FiHome, FiMessageCircle, FiBriefcase, FiZap,
} from 'react-icons/fi';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
  { name: 'Conversations', icon: FiMessageCircle, path: '/conversations' },
  { name: 'AI Agents', icon: FiBriefcase, path: '/agent-config' },
  { name: 'Templates', icon: FiZap, path: '/templates' },
];

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      bg="rgba(23,21,26,.85)"
      backdropFilter="blur(16px)"
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      boxShadow="0 1px 0 rgba(194,31,61,.15)"
      px={{ base: 3, md: 5 }}
      py={3}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={2}>
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="ghost"
            color="white"
            size="sm"
            _hover={{ bg: 'brand.600' }}
            onClick={onOpen}
          />
          <Text color="white" fontWeight="semibold" fontSize="md">
            ABC Company
          </Text>
        </Flex>

        <Flex align="center" gap={2}>
          <Tooltip label="Toggle color mode">
            <IconButton
              aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              variant="ghost"
              color="white"
              size="sm"
              _hover={{ bg: 'brand.600' }}
              onClick={toggleColorMode}
            />
          </Tooltip>

          <Menu>
            <MenuButton>
              <Avatar size="sm" name="Supervisor" bg="brand.500" color="white" />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />}>Profile</MenuItem>
              <MenuItem icon={<FiSettings />}>Settings</MenuItem>
              <MenuItem icon={<FiHelpCircle />}>Help</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader color="brand.500">SupportIQ</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={1}>
              {NAV_ITEMS.map(item => (
                <Button
                  key={item.path}
                  as={Link}
                  to={item.path}
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<Icon as={item.icon} boxSize={5} />}
                  bg={location.pathname === item.path ? 'rgba(194,31,61,.12)' : 'transparent'}
                  color={location.pathname === item.path ? 'brand.400' : 'whiteAlpha.700'}
                  onClick={onClose}
                >
                  {item.name}
                </Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Header;
