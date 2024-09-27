class SemanticError extends Error {
    constructor(message) {
        super(message);
        this.name = "SemanticError";
    }
}

class SymbolTable {
    constructor() {
        this.symbols = {};
    }

    declareVariable(name, type, scope, line) {
        if (this.symbols[name]) {
            throw new SemanticError(`Variable "${name}" is already declared.`);
        }
        this.symbols[name] = { type, scope, declarationLine: line, usageLines: [] };
    }

    getVariableType(name, line) {
        if (!this.symbols[name]) {
            throw new SemanticError(`Variable "${name}" is used but not declared.`);
        }
        this.symbols[name].usageLines.push(line);
        return this.symbols[name].type;
    }

    getAllSymbols() {
        return Object.entries(this.symbols).map(([name, { type, scope, declarationLine, usageLines }]) => ({
            name,
            type,
            scope,
            declarationLine,
            usageLines: usageLines.join(', ')
        }));
    }
}

export function semanticAnalysis(parseTree, totalHeaderLines) {
    const symbolTable = new SymbolTable();
    let currentLine = totalHeaderLines + 1;
    function analyzeNode(node, scope = 'global') {
        if (!node) {
            return; 
        }
        switch (node.type) {
            case 'Program':
                node.children.forEach(analyzeNode);
                break;
            case 'Include':
                break;
            case 'Function':
                const functionName = node.value;
                scope = functionName;
                currentLine = node.line;
                node.children.forEach(child => analyzeNode(child, scope));
                break;
            case 'Declaration':
                const [type, identifier] = node.value.split(' ');
                symbolTable.declareVariable(identifier, type, scope, totalHeaderLines + node.line);
                currentLine = node.line;
                node.children.forEach(child => analyzeNode(child, scope));
                break;
            case 'Return':
                currentLine = node.line;
                analyzeNode(node.children[0], scope);
                break;
            case 'Expression':
                analyzeNode(node.children[0], scope);
                analyzeNode(node.children[1], scope);
                break;
            case 'Identifier':
                return symbolTable.getVariableType(node.value, totalHeaderLines + node.line);
            case 'Number':
                return 'int';
            default:
                throw new SemanticError(`Unknown node type: ${node.type}`);
        }
    }    

    try {
        analyzeNode(parseTree);
        return {
            success: true,
            message: 'Semantic analysis passed successfully.',
            symbolTable: symbolTable.getAllSymbols()
        };
    } catch (error) {
        return {
            success: false,
            message: `Semantic analysis failed: ${error.message}`,
            symbolTable: symbolTable.getAllSymbols()
        };
    }    
}
