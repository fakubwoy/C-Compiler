import React, { useState } from 'react';
import { preprocessCode } from './utils/preprocessor';
import { tokenizeCode } from './utils/tokenizer';
import { parseTokens, ParseTreeNode } from './utils/parser';
import './App.css';

function App() {
    const [code, setCode] = useState('');
    const [preprocessedCode, setPreprocessedCode] = useState('');
    const [tokens, setTokens] = useState([]);
    const [parseTree, setParseTree] = useState(null);

    const handleCompile = () => {
        const result = preprocessCode(code);
        setPreprocessedCode(result);
        
        const tokenList = tokenizeCode(result);
        setTokens(tokenList);

        const tree = parseTokens(tokenList);
        setParseTree(tree);
    };

    const renderParseTree = (node) => {
        return (
            <div key={node.value} style={{ marginLeft: '20px' }}>
                <div>{node.type}: {node.value}</div>
                {node.children.map(child => renderParseTree(child))}
            </div>
        );
    };

    return (
        <div className="app-container">
            <h1>C-Compiler-proto-</h1>
            <textarea
                rows="10"
                cols="50"
                id="sourcecode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your C code here"
            />
            <br />
            <button onClick={handleCompile}>Tokenize</button>
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
            {parseTree && renderParseTree(parseTree)}
        </div>
    );
}

export default App;
