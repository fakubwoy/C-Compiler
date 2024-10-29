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

app.post('/compile', (req, res) => {
    const asmCode = req.body.code;

    fs.writeFileSync('temp.asm', asmCode);

    exec('nasm -f elf64 temp.asm && ld -o output temp.o', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${stderr}`);
            return res.status(500).send('Compilation error');
        }

        res.download('output', 'output', (err) => {
            if (err) {
                console.error(err);
            }

            fs.unlinkSync('temp.asm');
            fs.unlinkSync('output');
            fs.unlinkSync('temp.o');
        });
    });
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const phase = identifyPhase(message.toLowerCase());
  
  let fullPrompt;
  if (phase === 'OVERVIEW') {
    fullPrompt = `The compilation process consists of: 
    Preprocessing, Lexical Analysis, Syntax Analysis, Semantic Analysis, Intermediate Code Generation, Optimization, Code Generation`;
  } else {
    fullPrompt = `${CONTEXT}\n\nUser: ${message}\nAssistant: ${phase ? `Here is the definition of the ${phase} phase:` : 'Let me help you understand the compilation process.'} `;
  }
  try {
    const response = await huggingFaceApi.post(
      '/models/microsoft/Phi-3-mini-4k-instruct',
      {
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 300,
          return_full_text: false,
          do_sample: true,
          temperature: 0.1,
          top_p: 0.9,
          presence_penalty: 0.6,
          frequency_penalty: 0.6
        }
      }
    );

    let botReply;
    if (Array.isArray(response.data)) {
      botReply = response.data[0]?.generated_text || response.data[0]?.text;
    } else {
      botReply = response.data?.generated_text || response.data?.text;
    }

    botReply = cleanResponse(botReply, CONTEXT);

    res.json({ reply: botReply });

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

    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.response?.data?.error || error.message
    });
  }
});

function identifyPhase(question) {
  const overviewPatterns = [
    'what is compilation',
    'what is compiler',
    'what is the compiler',
    'what does the compiler do',
    'what is the purpose of the compiler',
    'what are the phases of compilation',
    'what are the steps of compilation',
    'what are the stages of compilation',
    'what are the components of compilation',
    'what are the parts of compilation',
  ];
  
  if (overviewPatterns.some(pattern => question.toLowerCase().includes(pattern))) {
    return 'OVERVIEW';
  }
  const phaseKeywords = {
    'pre': 'PREPROCESSING',
    'preprocessing': 'PREPROCESSING',
    'tokenization': 'LEX_ANALYSIS',
    'lexical analysis': 'LEXICAL_ANALYSIS',
    'lexing': 'LEXICAL_ANALYSIS',
    'syntax': 'SYNTAX_ANALYSIS',
    'semantic': 'SEMANTIC_ANALYSIS',
    'intermediate': 'INTERMEDIATE_CODE_GENERATION',
    'optimization': 'OPTIMIZATION',
    'code generation': 'CODE_GENERATION'
  };

  for (const [keyword, phase] of Object.entries(phaseKeywords)) {
    if (question.includes(keyword)) {
      return phase;
    }
  }
  return null;
}

function cleanResponse(response, context) {
  if (!response) return '';
  
  let cleaned = response
    .replace(/^#{1,6}\s+/gm, '')
    .replace(context, '')
    .replace(/^\d+\.\s*/gm, '')
    .replace(/\d+\.\s*$/g, '')
    .replace(/This process is also known as.*?\./, '')
    .replace(/^(Answer:|Assistant:|Here is the definition of|Let me help you understand|The|This is)/gi, '')
    .replace(/PREPROCESSING:|LEXICAL_ANALYSIS:|SYNTAX_ANALYSIS:|SEMANTIC_ANALYSIS:|INTERMEDIATE_CODE_GENERATION:|OPTIMIZATION:|CODE_GENERATION:|CODE_EMISSION:|CODE_EXECUTION:/gi, '')
    .replace(/PREPROCESSING|LEXICAL_ANALYSIS|SYNTAX_ANALYSIS|SEMANTIC_ANALYSIS|INTERMEDIATE_CODE_GENERATION|OPTIMIZATION|CODE_GENERATION|CODE_EMISSION|CODE_EXECUTION/gi, '')
    .replace(/Definition:\s*/i, '')
    .replace(/User:\s*[^?]*\?/g, '')
    .replace(/.*?Directives:/, '')
    .replace(/.*?\?/, '')
    .replace(/Assistant:\s*/i, '')
    .replace(/Message:/i, '')
    .replace(/Response:/i, '')
    .replace(/\s+/g, ' ')
    .trim();
    if (cleaned.length > 200) {
      const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
      cleaned = sentences
        .reduce((acc, sentence) => {
          if (acc.length + sentence.length <= 200) {
            return acc + sentence;
          }
          return acc;
        }, '')
        .trim();
    }
  return cleaned;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /chat');
  console.log('- POST /compile');
  console.log('- GET /health');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});