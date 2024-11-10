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
import { ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types'
import muiTheme from './theme';

import MessageBox from './components/MessageBox';

function ChatBox({ chats }) {
  return (
    <Box sx={{ pb: '100px' }}>
      {chats.map((chat, index) => (
        <Box key={index} sx={{ marginBottom: 2 }}>
          <MessageBox type={chat.type} chatContent={chat.content} />
        </Box>
      ))}
    </Box>
  );
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
    const promptText = event.target.value;
    const isEnter = (event.code === 'Enter' || event.code === 'NumpadEnter');
    if (isEnter && promptText.trim() === '' && !event.shiftKey) {
      event.preventDefault();
    }
    if (isEnter && event.shiftKey) {
      return;
    }
    if (isEnter && !event.shiftKey && !disabled && promptText.trim() !== '') {
      setPrompt('')
      handleSend();
      event.preventDefault();
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 2,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 -2px 20px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDownCapture={handleKeyPress}
          placeholder="Type your message..."
          multiline
          minRows={1}
          maxRows={5}
        />
        <Button variant="contained"
          color="primary"
          onClick={handleSend}
          sx={{ marginLeft: 2 }}
          disabled={disabled || prompt.trim() === ''}
        >
          Send
        </Button>
      </Container>
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
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
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
    handleReconnect()
  }, [])

  const handleReconnect = () => {
    if (websocket) {
      websocket.close()
    }
    const ws = new WebSocket('ws://' + window.location.host + '/api/ws')
    ws.addEventListener('open', () => {
      console.log('connected')
      setWebsocket(ws)
      ws.send(JSON.stringify({ type: 'get-chats' }))
    })
    ws.addEventListener('close', () => {
      console.log('disconnected')
      setWebsocket(null)
      setTimeout(handleReconnect, 1000)
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
  }

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight, { behavior: 'smooth' })
  }, [chats])

  const handleSend = () => {
    websocket.send(
      JSON.stringify({ type: 'send-message', prompt: prompt })
    )
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Container>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            p: 3,
            textAlign: 'center',
            background: 'linear-gradient(45deg, #6d8ae1 30%, #53fffc 90%)',
            fontWeight: 900,
            fontFamily: 'monospace',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
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