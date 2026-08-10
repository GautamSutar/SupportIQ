// src/theme.js
import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#fbe6ea',
      100: '#f3b9c4',
      200: '#e98a9c',
      300: '#e05b74',
      400: '#e9435f',
      500: '#c21f3d',
      600: '#a11832',
      700: '#4a1119',
      800: '#2e0b10',
      900: '#1a0609',
    },
    surface: {
      50: '#f3f1ec',
      900: '#0b0a0c',
      800: '#17151a',
      700: '#1d1a20',
      600: '#26222a',
    },
  },
  fonts: {
    heading: `'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif`,
    body: `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`,
    mono: `ui-monospace,'SF Mono','Cascadia Code','Roboto Mono',Consolas,monospace`,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'surface.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'surface.50' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.400',
          },
          _active: {
            bg: 'brand.600',
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.400',
          _hover: {
            bg: 'brand.900',
          },
        },
      },
    },
    Card: {
      baseStyle: (props) => ({
        p: '4',
        borderRadius: 'lg',
        boxShadow: props.colorMode === 'dark' ? '0 20px 40px -20px rgba(0,0,0,.6)' : 'sm',
        bg: props.colorMode === 'dark' ? 'surface.800' : 'white',
        border: '1px solid',
        borderColor: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100',
      }),
    },
  },
});

export default theme;
