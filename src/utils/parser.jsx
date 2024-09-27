export class ParseTreeNode {
    constructor(type, value) {
        this.type = type;
        this.value = value;
        this.children = [];
    }

    addChild(node) {
        this.children.push(node);
    }
}

export function parseTokens(tokens) {
    let index = 0;

    function parseFunction() {
        const node = new ParseTreeNode('Function', tokens[index + 1].value);
        node.line = tokens[index + 1].line;
        index += 2; 
        index++;
        index++; 

        if (tokens[index]?.value !== '{') {
            throw new SyntaxError(`Expected '{' at line ${tokens[index].line}`);
        }
        index++; 
        
        while (index < tokens.length && tokens[index].value !== '}') {
            if (tokens[index].type === 'KEYWORD' && (tokens[index].value === 'int' || tokens[index].value === 'float')) {
                node.addChild(parseDeclaration());
            } else if (tokens[index].type === 'KEYWORD' && tokens[index].value === 'return') {
                node.addChild(parseReturn());
            } else {
                index++;
            }
        }
        
        if (tokens[index]?.value !== '}') {
            throw new SyntaxError(`Expected '}' at line ${tokens[index].line}`);
        }
        index++; 
        return node;
    }

    function parseDeclaration() {
        const type = tokens[index].value; 
        index++; 
        const identifier = tokens[index].value; 
        const declarationNode = new ParseTreeNode('Declaration', `${type} ${identifier}`);
        declarationNode.line = tokens[index].line;  
        index++; 
        index++; 
        declarationNode.addChild(parseExpression());
        
        if (tokens[index]?.value !== ';') {
            throw new SyntaxError(`Expected ';' at line ${tokens[index].line}`);
        }
        index++; 
        
        return declarationNode;
    }

    function parseReturn() {
        const returnNode = new ParseTreeNode('Return', 'return');
        returnNode.line = tokens[index].line;  
        index++; 
        returnNode.addChild(parseExpression());
        
        if (tokens[index]?.value !== ';') {
            throw new SyntaxError(`Expected ';' at line ${tokens[index].line}`);
        }
        index++; 
        
        return returnNode;
    }

    function parseExpression() {
        let expressionNode;
        
        if (tokens[index]?.value === '(') {
            index++;
            expressionNode = parseExpression();
    
            if (tokens[index]?.value !== ')') {
                throw new SyntaxError(`Expected ')' at line ${tokens[index].line}`);
            }
            index++;
        } 
        else if (tokens[index].type === 'NUMBER') {
            expressionNode = new ParseTreeNode('Number', tokens[index].value);
            expressionNode.line = tokens[index].line;  
            index++;
        } else if (tokens[index].type === 'IDENTIFIER') {
            expressionNode = new ParseTreeNode('Identifier', tokens[index].value);
            expressionNode.line = tokens[index].line; 
            index++;
        }

        if (index < tokens.length && tokens[index].type === 'OPERATOR') {
            const operatorNode = new ParseTreeNode('Expression', tokens[index].value);
            operatorNode.line = tokens[index].line;
            operatorNode.addChild(expressionNode);
            index++; 
            operatorNode.addChild(parseExpression());
            return operatorNode;
        }

        return expressionNode;
    }

    function parse() {
        const root = new ParseTreeNode('Program', 'Root');

        if (tokens[index]?.value !== 'int' || tokens[index + 1]?.value !== 'main') {
            throw new SyntaxError(`Expected 'int main()' at line ${tokens[index].line}`);
        }
        
        root.addChild(parseFunction());
        return root;
    }

    return parse();
}
