import React, { useState } from 'react';
import { preprocessCode } from './utils/preprocessor';
import { tokenizeCode } from './utils/tokenizer';
import { parseTokens } from './utils/parser';
import { semanticAnalysis } from './utils/semanticAnalyzer';
import './App.css';

const TreeNode = ({ node, isLast, prefix = '' }) => {
  const nodePrefix = prefix + (isLast ? '└── ' : '├── ');
  const childPrefix = prefix + (isLast ? '    ' : '│   ');

  return (
    <div>
      <div className="tree-node">
        {nodePrefix}{node.type}: {node.value}
      </div>
      {node.children.map((child, index) => (
        <TreeNode
          key={index}
          node={child}
          isLast={index === node.children.length - 1}
          prefix={childPrefix}
        />
      ))}
    </div>
  );
};

function App() {
  const [code, setCode] = useState('');
  const [preprocessedCode, setPreprocessedCode] = useState('');
  const [tokens, setTokens] = useState([]);
  const [parseTree, setParseTree] = useState(null);
  const [semanticResult, setSemanticResult] = useState(null);
  const [symbolTable, setSymbolTable] = useState([]);

  const handleCompile = () => {
    try {
      const result = preprocessCode(code);
      setPreprocessedCode(result);
      
      const tokenList = tokenizeCode(result);
      setTokens(tokenList);

      const tree = parseTokens(tokenList);
      setParseTree(tree);

      const semanticCheck = semanticAnalysis(tree);
      setSemanticResult(semanticCheck);
      setSymbolTable(semanticCheck.symbolTable);
    } catch (error) {
      setSemanticResult({
        success: false,
        message: `Error during compilation: ${error.message}`
      });
      setSymbolTable([]);
    }
  };

  return (
    <div className="app-container">
      <h1>C-Compiler</h1>
      <textarea
        rows="10"
        cols="50"
        id="sourcecode"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter your C code here"
      />
      <br />
      <button onClick={handleCompile}>Compile</button>
      <h2>Preprocessed Code:</h2>
      <pre>{preprocessedCode}</pre>
      <h2>Tokens:</h2>
      <div className="token-list">
        {tokens.map((token, index) => (
          <div key={index} className={`token ${token.type}`}>
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
                  <td>{entry.usageLines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No variables declared.</p>
        )}
      </div>
    </div>
  );
}

export default App;
