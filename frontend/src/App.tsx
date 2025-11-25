import { useState } from 'react'
import { Box, Button, Container, Typography, Stack } from '@mui/material'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3} alignItems="center">
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Box
            component="a"
            href="https://vite.dev"
            target="_blank"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <img src={viteLogo} alt="Vite logo" style={{ height: '60px' }} />
          </Box>
          <Box
            component="a"
            href="https://react.dev"
            target="_blank"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <img src={reactLogo} alt="React logo" style={{ height: '60px' }} />
          </Box>
        </Box>
        <Typography variant="h3" component="h1">
          Vite + React
        </Typography>
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            textAlign: 'center',
          }}
        >
          <Button
            variant="contained"
            onClick={() => setCount((count) => count + 1)}
            sx={{ mb: 2 }}
          >
            count is {count}
          </Button>
          <Typography variant="body1">
            Edit <code>src/App.tsx</code> and save to test HMR
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
          Click on the Vite and React logos to learn more
        </Typography>
      </Stack>
    </Container>
  )
}

export default App
