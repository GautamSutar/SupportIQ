import React from 'react';
import { Box, Flex, useColorMode } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const { colorMode } = useColorMode();

  return (
    <Box minHeight="100vh">
      <Header />
      <Flex>
        <Sidebar />
        <Box
          as="main"
          flex="1"
          minW={0}
          p={4}
          bg={colorMode === 'dark' ? 'surface.900' : 'gray.50'}
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
