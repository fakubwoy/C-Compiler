require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

let CONTEXT;
try {
  CONTEXT = fs.readFileSync(path.join(__dirname, 'context.txt'), 'utf8');
} catch (error) {
  console.error('Error reading context file:', error);
  process.exit(1);
}

const huggingFaceApi = axios.create({
  baseURL: 'https://api-inference.huggingface.co',
  headers: {
    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000
});

function isGreeting(message) {
  return /^(hi|hello|hey|greetings|good (morning|afternoon|evening))$/i.test(message.trim());
}

function isOverviewQuestion(message) {
  return /what (is|are) (the )?(compiler|compilation|process|phases|steps|stages)/i.test(message);
}

function isCompilerPhaseQuestion(message) {
  const phases = [
    'preprocessing', 'lexical analysis', 'syntax analysis',
    'semantic analysis', 'intermediate code', 'optimization', 
    'code generation', 'compiler', 'compilation'
  ];
  
  return phases.some(phase => message.toLowerCase().includes(phase.toLowerCase()));
}

function isDetailedRequest(message) {
  return /explain|tell me more|in depth|detailed|how|describe|elaborate/i.test(message);
}

function generatePrompt(message, isDetailed) {
  const basePrompt = "You are a compiler education expert. Provide a";
  const detailLevel = isDetailed ? 
    "detailed explanation in 6-8 complete sentences about" : 
    "brief explanation in 1-2 sentences about";
  
  return `${basePrompt} ${detailLevel} ${message}. ${isDetailed ? 'Cover the key concepts, components, and their relationships.' : 'Focus only on the core concept.'} The response must be complete and not cut off mid-sentence.`;
}

function handleGreeting() {
  return "Hello! I'm here to help you understand the compilation process and its phases. Feel free to ask me anything about compilation!";
}

function handleOverview() {
  return `The compilation process transforms source code into machine code through several phases: preprocessing, lexical analysis, syntax analysis, semantic analysis, intermediate code generation, optimization, and code generation. Each phase performs a specific task in converting high-level code into executable format. Feel free to ask about any specific phase!`;
}

async function getAIResponse(message, isDetailed) {
  const prompt = generatePrompt(message, isDetailed);
  
  const apiResponse = await huggingFaceApi.post(
    '/models/microsoft/Phi-3-mini-4k-instruct',
    {
      inputs: prompt,
      parameters: {
        max_new_tokens: isDetailed ? 500 : 150,
        return_full_text: false,
        do_sample: true,
        temperature: 0.4,
        top_p: 0.9,
        presence_penalty: 0.6,
        frequency_penalty: 0.6
      }
    }
  );

  const responseText = Array.isArray(apiResponse.data) 
    ? (apiResponse.data[0]?.generated_text || apiResponse.data[0]?.text)
    : (apiResponse.data?.generated_text || apiResponse.data?.text);

  return cleanResponse(responseText, isDetailed);
}

function cleanResponse(response, isDetailed) {
  if (!response) return '';
  
  let cleaned = response
    .replace(/^(As an AI language model,|Let me|I will|I can|I am|Here's|According to|Let's|Alright,|Okay,)/i, '')
    .replace(/(User|Assistant|Human):\s*/g, '')
    .replace(/^\d+\.\s*/gm, '')
    .replace(/^(Can you|Could you|Please|I want to know|Tell me|Explain|What is|How does).*\?/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = cleaned.match(/[^.!?]+(?:[.!?](?![\d])|[.!?]$)+/g) || [];
  
  const maxSentences = isDetailed ? 8 : 2;
  
  return sentences
    .slice(0, maxSentences)
    .join(' ')
    .trim();
}

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    if (isGreeting(message)) {
      return res.json({ reply: handleGreeting() });
    }

    if (isOverviewQuestion(message)) {
      return res.json({ reply: handleOverview() });
    }

    if (isCompilerPhaseQuestion(message)) {
      const isDetailed = isDetailedRequest(message);
      const aiResponse = await getAIResponse(message, isDetailed);
      
      if (!aiResponse) {
        return res.json({ 
          reply: "I apologize, but I couldn't generate a proper response. Could you please rephrase your question?" 
        });
      }
      
      return res.json({ reply: aiResponse });
    }

    return res.json({ 
      reply: "I'm specialized in explaining compiler concepts and phases. Could you please ask something specific about the compilation process or any of its phases?" 
    });

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key or unauthorized access' });
    }
    if (error.response?.status === 503) {
      return res.status(503).json({ error: 'Model is currently loading. Please try again in a few seconds' });
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request timed out. The model might be taking too long to respond' });
    }

    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.response?.data?.error || error.message
    });
  }
});

app.post('/compile', (req, res) => {
  const asmCode = req.body.code;

  if (!asmCode) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const tempFile = path.join(__dirname, 'temp.asm');
  const outputFile = path.join(__dirname, 'output');
  const objFile = path.join(__dirname, 'temp.o');

  try {
    fs.writeFileSync(tempFile, asmCode);

    exec('nasm -f elf64 temp.asm && ld -o output temp.o', (error, stdout, stderr) => {
      if (error) {
        console.error(`Compilation error: ${stderr}`);
        return res.status(500).json({ error: 'Compilation failed', details: stderr });
      }

      res.download(outputFile, 'output', (err) => {
        if (err) {
          console.error('Download error:', err);
        }

        [tempFile, outputFile, objFile].forEach(file => {
          if (fs.existsSync(file)) {
            try {
              fs.unlinkSync(file);
            } catch (e) {
              console.error(`Error deleting file ${file}:`, e);
            }
          }
        });
      });
    });
  } catch (error) {
    console.error('File operation error:', error);
    return res.status(500).json({ error: 'Failed to process assembly code', details: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    context: {
      loaded: !!CONTEXT
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /chat - Chat with the compiler assistant');
  console.log('- POST /compile - Compile assembly code');
  console.log('- GET /health - Check server health');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});