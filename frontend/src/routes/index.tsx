import { createFileRoute } from '@tanstack/react-router'
import { Box, Container, Typography, Link as MuiLink, Stack } from '@mui/material'
import logo from '../logo.svg'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <Container maxWidth="md">
      <Stack
        component="header"
        spacing={3}
        alignItems="center"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="logo"
          sx={{
            height: { xs: '100px', sm: '120px', md: '150px' },
            animation: 'spin 20s linear infinite',
            '@keyframes spin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
          }}
        />
        <Typography variant="body1">
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </Typography>
        <Stack spacing={1}>
          <MuiLink
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
            component="a"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontSize: '1.1rem',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Learn React
          </MuiLink>
          <MuiLink
            href="https://tanstack.com"
            target="_blank"
            rel="noopener noreferrer"
            component="a"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontSize: '1.1rem',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Learn TanStack
          </MuiLink>
        </Stack>
      </Stack>
    </Container>
  )
}
