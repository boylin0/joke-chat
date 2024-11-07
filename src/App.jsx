import { useState, useEffect } from 'react'
import {
  Container,
  TextField,
  Button,
  CssBaseline,
  Box,
  Typography,
} from '@mui/material'
import CircleIcon from '@mui/icons-material/Circle';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PropTypes from 'prop-types'

function ChatBox({ chats }) {
  return (
    <Box>
      {chats.map((chat, index) => (
        <Box key={index} sx={{ marginBottom: 2 }}>
          <strong>{chat.type === 'ai' ? 'AI' : 'User'}:</strong> {chat.content}
        </Box>
      ))}
    </Box>
  )
}

ChatBox.propTypes = {
  chats: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
    })
  ).isRequired,
}

function PromptInput({ prompt, setPrompt, handleSend, disabled }) {

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && prompt && !disabled) {
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyUp={handleKeyPress}
        placeholder="Type your message..."
      />
      <Button variant="contained" color="primary" onClick={handleSend} sx={{ marginLeft: 2 }} disabled={!prompt || disabled}>
        Send
      </Button>
    </Box>
  )
}

PromptInput.propTypes = {
  prompt: PropTypes.string.isRequired,
  setPrompt: PropTypes.func.isRequired,
  handleSend: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}


function Status({ websocket }) {
  const [status, setStatus] = useState('Disconnected')

  useEffect(() => {
    setStatus(websocket ? 'Connected' : 'Disconnected')
  }, [websocket])

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ mx: 1 }}>Status: {status}</Box>
      <CircleIcon sx={{ color: websocket ? 'green' : 'red' }} />
    </Box>
  )

}
Status.propTypes = {
  websocket: PropTypes.instanceOf(WebSocket),
};

function App() {
  const [websocket, setWebsocket] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [chats, setChats] = useState([])

  useEffect(() => {
    const ws = new WebSocket('ws://' + window.location.host + '/api/ws')
    ws.addEventListener('open', () => {
      console.log('connected')
      setWebsocket(ws)
      ws.send(JSON.stringify({ type: 'get-chats' }))
    })
    ws.addEventListener('close', () => {
      console.log('disconnected')
      setWebsocket(null)
    })
    let g_chats = []
    ws.onmessage = (message) => {
      console.log('received:', message.data)
      const data = JSON.parse(message.data)
      const type = data.type

      if (type === 'get-chats') {
        g_chats = data.chats
        setChats(data.chats)
      } else if (type === 'llm-chunk') {
        const content = data.content
        let newChats = [...g_chats]
        if (newChats.length > 0 && newChats[newChats.length - 1].type !== 'ai') {
          newChats.push({ type: 'ai', content: content })
        } else {
          console.log(newChats)
          newChats[newChats.length - 1].content += content
        }
        g_chats = newChats
        setChats(newChats)
      }
    }
  }, [])

  const handleSend = () => {
    setPrompt('')
    websocket.send(
      JSON.stringify({ type: 'send-message', prompt: prompt })
    )
  }

  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <CssBaseline />
        <Typography variant="h4" component="h1" gutterBottom>
          AskChat
        </Typography>
        <Status websocket={websocket} />
        <ChatBox chats={chats} />
        <PromptInput prompt={prompt} setPrompt={setPrompt} handleSend={handleSend} disabled={!websocket} />
      </Container>
    </ThemeProvider>
  )
}

export default App;