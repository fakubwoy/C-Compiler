// src/components/CodeInput.js
import React, { useState } from 'react';

const CodeInput = ({ onSubmit }) => {
    const [code, setCode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(code);
    };

    return (
        <form onSubmit={handleSubmit}>
            <textarea
                rows="10"
                cols="50"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your C code here..."
            />
            <button type="submit">Compile</button>
        </form>
    );
};

export default CodeInput;
