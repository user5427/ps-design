import { createFileRoute } from '@tanstack/react-router'
import { Box, Container, Typography, Link as MuiLink, Stack, TextField, Button, Alert } from '@mui/material'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const basic = btoa(`${email}:${password}`)
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { Authorization: `Basic ${basic}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Login failed')
      }
      if (data.isPasswordResetRequired) {
        setInfo('Password reset required. Please change your password.')
      } else {
        setInfo('Login successful.')
      }
    } catch (e: any) {
      setError(e.message || 'Login error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ backgroundColor: '#000', minHeight: '100vh' }}>
      <Stack spacing={3} sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ color: '#fff', textAlign: 'center' }}>
          Sign In
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            variant="filled"
            InputProps={{ sx: { backgroundColor: '#2b2b2b', color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#bbb' } }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            variant="filled"
            InputProps={{ sx: { backgroundColor: '#2b2b2b', color: '#fff' } }}
            InputLabelProps={{ sx: { color: '#bbb' } }}
          />
          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={handleLogin}
            sx={{ mt: 2 }}
          >
            {loading ? 'Logging in…' : 'Login'}
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {info && (
          <Alert severity={info.includes('required') ? 'warning' : 'success'}>
            {info}
          </Alert>
        )}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <MuiLink href="#" sx={{ color: '#8ab4f8' }}>
            Forgot password?
          </MuiLink>
        </Box>
      </Stack>
    </Container>
  )
}
