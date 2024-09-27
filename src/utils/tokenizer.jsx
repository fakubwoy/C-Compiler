export function tokenizeCode(code) {
    const tokens = [];
    const tokenPatterns = [
        { type: 'KEYWORD', regex: /\b(?:int|float|double|char|return|if|else|while|for|void|printf)\b/g },
        { type: 'IDENTIFIER', regex: /\b[a-zA-Z_]\w*\b/g },
        { type: 'NUMBER', regex: /\b\d+(\.\d+)?\b/g },
        { type: 'STRING', regex: /"([^"\\]|\\.)*"/g },
        { type: 'OPERATOR', regex: /[+\-*/%=&|<>!]+/g },
        { type: 'PUNCTUATION', regex: /[;{},()]/g },
        { type: 'WHITESPACE', regex: /\s+/g }
    ];

    let remainingCode = code;
    let currentLine = 1;

    while (remainingCode.length > 0) {
        let matchFound = false;

        for (const { type, regex } of tokenPatterns) {
            regex.lastIndex = 0;
            const match = regex.exec(remainingCode);
            if (match && match.index === 0) {
                if (type === 'WHITESPACE') {
                    const newlineMatches = match[0].match(/\n/g);
                    if (newlineMatches) {
                        currentLine += newlineMatches.length; 
                    }
                } else {
                    tokens.push({ type, value: match[0], line: currentLine });
                }
                remainingCode = remainingCode.slice(match[0].length);
                matchFound = true;
                break;
            }
        }

        if (!matchFound) {
            console.error('Unexpected character:', remainingCode[0]);
            remainingCode = remainingCode.slice(1);
        }
    }

    return tokens;
}
