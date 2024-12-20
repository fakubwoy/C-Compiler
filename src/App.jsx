import React, { useState, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { preprocessCode } from './utils/preprocessor';
import { tokenizeCode } from './utils/tokenizer';
import { parseTokens } from './utils/parser';
import { semanticAnalysis } from './utils/semanticAnalyzer';
import { generateThreeAddressCode } from './utils/threeAddressCodeGenerator'; 
import { optimizeTAC } from './utils/optimizer';
import { generateX86Assembly } from './utils/x86ARMGenerator'; 
import Chatbot from './components/Chatbot';
import './App.css';

const TreeNode = ({ node, isLast, prefix = '' }) => {
  if (!node) {
      return <div className="tree-node">Error: Node is undefined</div>;
  }

  const nodePrefix = prefix + (isLast ? '└── ' : '├── ');

  return (
      <div>
          <div className="tree-node">
              {nodePrefix}{node.type || 'Unknown'}: {node.value || 'N/A'}
          </div>
          {node.children && node.children.map((child, index) => (
              <TreeNode
                  key={index}
                  node={child}
                  isLast={index === node.children.length - 1}
                  prefix={prefix + (isLast ? '    ' : '│   ')}
              />
          ))}
      </div>
  );
};

function App() {
  const [code, setCode] = useState('');
  const [headers, setHeaders] = useState([]);
  const [preprocessedCode, setPreprocessedCode] = useState('');
  const [tokens, setTokens] = useState([]);
  const [parseTree, setParseTree] = useState(null);
  const [semanticResult, setSemanticResult] = useState(null);
  const [symbolTable, setSymbolTable] = useState([]);
  const [tacCode, setTacCode] = useState(''); 
  const [optimizedTAC, setOptimizedTAC] = useState('');
  const [x86AssemblyCode, setX86AssemblyCode] = useState('');
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleCompile = async () => {
    try {
        const currentCode = editorRef.current.getValue();
        const { code: preprocessedCode, headers, totalHeaderLines } = preprocessCode(currentCode);
        setPreprocessedCode(preprocessedCode);
        
        setHeaders(headers);
        const tokenList = tokenizeCode(preprocessedCode);
        setTokens(tokenList);

        const tree = parseTokens(tokenList, headers); 
        setParseTree(tree);

        const semanticCheck = semanticAnalysis(tree, totalHeaderLines); 
        setSemanticResult(semanticCheck);
        setSymbolTable(semanticCheck.symbolTable);

        const tacCodeGenerated = generateThreeAddressCode(tree, semanticCheck.symbolTable);
        setTacCode(tacCodeGenerated); 

        const optimizedCode = optimizeTAC(tacCodeGenerated);
        setOptimizedTAC(optimizedCode);

        const x86AssemblyCodeGenerated = generateX86Assembly(optimizedCode);
        setX86AssemblyCode(x86AssemblyCodeGenerated);

        const response = await fetch('http://localhost:5000/compile', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: x86AssemblyCodeGenerated }),
      });

      if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'output';
          a.click();
      } else {
          setSemanticResult({
              success: false,
              message: 'Error compiling assembly code.'
          });
      }

    } catch (error) {
        setSemanticResult({
            success: false,
            message: `Error during compilation: ${error.message}`
        });
        setSymbolTable([]);
        setTacCode('');
        setOptimizedTAC('');
        setX86ARMCode('');
    }
  };

  const formatUsageLines = (usageLines) => {
    if (Array.isArray(usageLines)) {
      return usageLines.join(', ');
    } else if (typeof usageLines === 'number') {
      return usageLines.toString();
    } else if (usageLines === undefined || usageLines === null) {
      return 'N/A';
    } else {
      return JSON.stringify(usageLines);
    }
  };

  return (
    <div className="app-container">
      <h1>C-Compiler</h1>
      <Editor
        height="400px"
        defaultLanguage="c"
        theme="vs-dark"
        onMount={handleEditorDidMount}
      />
      <br />
      <button onClick={handleCompile}>Compile</button>
      
      <h2>Preprocessed Code:</h2>
      <pre>{preprocessedCode}</pre>
      
      <h2>Tokens:</h2>
      <div className="token-list">
        {tokens.map((token, index) => (
          <div key={index} className={`token type-${token.type}`}>
            {JSON.stringify(token, null, 2)}
          </div>
        ))}
      </div>
      
      <h2>Parse Tree:</h2>
      <div className="parse-tree">
        {parseTree && <TreeNode node={parseTree} isLast={true} />}
      </div>
      
      <h2>Semantic Analysis Result:</h2>
      {semanticResult && (
        <div className={`semantic-result ${semanticResult.success ? 'success' : 'error'}`}>
          {semanticResult.message}
        </div>
      )}
      <h2>Symbol Table:</h2>
      <div className="symbol-table">
        {symbolTable.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Symbol Name</th>
                <th>Type</th>
                <th>Scope</th>
                <th>Line of Declaration</th>
                <th>Lines of Usage</th>
              </tr>
            </thead>
            <tbody>
              {symbolTable.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.name}</td>
                  <td>{entry.type}</td>
                  <td>{entry.scope}</td>
                  <td>{entry.declarationLine}</td>
                  <td>{formatUsageLines(entry.usageLines)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No variables declared.</p>
        )}
      </div>
      <h2>Three Address Code (TAC):</h2>
      <pre>{tacCode}</pre>
      <h2>Optimized Three Address Code:</h2>
      <pre>{optimizedTAC}</pre>
      <h2>x86 Assembly Code:</h2>
      <pre>{x86AssemblyCode}</pre>
      <Chatbot />
    </div>
  );
}

export default App;