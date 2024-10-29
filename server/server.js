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

const contextParts = CONTEXT.split('Detailed Explanations:');
const BASIC_CONTEXT = contextParts[0];
const DETAILED_CONTEXT = contextParts[1];

const huggingFaceApi = axios.create({
  baseURL: 'https://api-inference.huggingface.co',
  headers: {
    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000
});


function getBasicDefinition(topic) {
  const definitions = BASIC_CONTEXT.split('\n')
    .filter(line => line.includes(':'))
    .map(line => {
      const [key, value] = line.split(':').map(part => part.trim());
      return { key: key.toLowerCase(), value };
    });

  const found = definitions.find(def => 
    def.key.includes(topic.toLowerCase()) ||
    topic.toLowerCase().includes(def.key)
  );

  return found ? found.value : null;
}

function getDetailedExplanation(topic) {
  const sections = DETAILED_CONTEXT.split(/\d+\.\s+/).filter(Boolean);
  
  const found = sections.find(section => {
    const firstLine = section.split('\n')[0].toLowerCase();
    return firstLine.includes(topic.toLowerCase());
  });

  if (found) {
    const bulletPoints = found.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2)) 
      .join('\n\n• '); 
    
    return `Here's a detailed explanation of ${topic}:\n\n• ${bulletPoints}\n`;
  }
  
  return null;
}

function generatePrompt(message) {
  if (/^(hi|hello|hey|greetings|good (morning|afternoon|evening))$/i.test(message.trim())) {
    return "Hello! I'm here to help you understand the compilation process and its phases. Feel free to ask me anything about compilation!";
  }

  const topics = [
    'compilation', 'preprocessing', 'lexical analysis', 'syntax analysis',
    'semantic analysis', 'intermediate code', 'optimization', 'code generation'
  ];

  const matchedTopic = topics.find(topic => 
    message.toLowerCase().includes(topic.toLowerCase())
  );

  if (/what (is|are) (the )?(compiler|compilation|process|phases|steps|stages)/i.test(message)) {
    return `The compilation process is the transformation of source code into machine code. It consists of seven main phases: preprocessing, lexical analysis, syntax analysis, semantic analysis, intermediate code generation, optimization, and code generation. Each phase performs a specific task in converting high-level code into executable format.`;
  }

  if (!matchedTopic) {
    return `${BASIC_CONTEXT}\n\nUser message: ${message}\n\nResponse:`;
  }

  const isDetailedRequest = /explain|tell me more|in depth|detailed|how|describe/i.test(message);

  if (isDetailedRequest) {
    const detailedExplanation = getDetailedExplanation(matchedTopic);
    if (detailedExplanation) {
      return detailedExplanation;
    }
  }

  const basicDefinition = getBasicDefinition(matchedTopic);
  return basicDefinition || "I don't have specific information about that topic.";
}

function cleanResponse(response) {
  if (!response) return '';
  
  let cleaned = response
    .replace(new RegExp(CONTEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    .replace(/^(As an AI language model,|Let me|I will|I can|I am|Here's|According to|Let's|Alright,|Okay,)/i, '')
    .replace(/(User|Assistant|Human):\s*/g, '')
    .replace(/^(PREPROCESSING|LEXICAL_ANALYSIS|SYNTAX_ANALYSIS|SEMANTIC_ANALYSIS|INTERMEDIATE_CODE_GENERATION|OPTIMIZATION|CODE_GENERATION):/gim, '')
    .replace(/^\d+\.\s*/gm, '')
    .replace(/^(Can you|Could you|Please|I want to know|Tell me|Explain|What is|How does).*\?/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 0) {
    let finalResponse = '';
    let currentLength = 0;
    
    for (const sentence of sentences) {
      if (currentLength + sentence.length <= 300) {
        finalResponse += sentence;
        currentLength += sentence.length;
      } else {
        break;
      }
    }
    
    return finalResponse.trim();
  }
  
  return cleaned;
}


app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = generatePrompt(message);
    
    if (/^(hi|hello|hey|greetings|good (morning|afternoon|evening))$/i.test(message.trim()) ||
        response.length < 500) { 
      return res.json({ reply: response });
    }

    const apiResponse = await huggingFaceApi.post(
      '/models/microsoft/Phi-3-mini-4k-instruct',
      {
        inputs: response,
        parameters: {
          max_new_tokens: 500,
          return_full_text: false,
          do_sample: true,
          temperature: 0.3,
          top_p: 0.9,
          presence_penalty: 0.6,
          frequency_penalty: 0.6
        }
      }
    );

    let finalResponse = Array.isArray(apiResponse.data) 
      ? (apiResponse.data[0]?.generated_text || apiResponse.data[0]?.text)
      : (apiResponse.data?.generated_text || apiResponse.data?.text);
    
    finalResponse = cleanResponse(finalResponse);

    res.json({ reply: finalResponse || response }); 

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    const directResponse = generatePrompt(message);
    if (directResponse) {
      return res.json({ reply: directResponse });
    }

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
      basic: !!BASIC_CONTEXT,
      detailed: !!DETAILED_CONTEXT
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