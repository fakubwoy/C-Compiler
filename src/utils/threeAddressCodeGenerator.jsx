class ThreeAddressCodeGenerator {
    constructor() {
        this.instructions = [];
        this.tempVarCounter = 0;
    }

    newTempVar() {
        return `t${this.tempVarCounter++}`;
    }

    generate(node, symbolTable, scope = 'global') {
        if (!node) {
            return null;
        }

        switch (node.type) {
            case 'Program':
                node.children.forEach(child => this.generate(child, symbolTable, scope));
                break;

            case 'Function':
                this.instructions.push(`func ${node.value} {`);
                node.children.forEach(child => this.generate(child, symbolTable, node.value));
                this.instructions.push(`}`);
                break;

            case 'Declaration':
                const [type, identifier] = node.value.split(' ');
                const tempVar = this.generate(node.children[0], symbolTable, scope);
                this.instructions.push(`${identifier} = ${tempVar}`);
                break;

            case 'Return':
                const returnVar = this.generate(node.children[0], symbolTable, scope);
                this.instructions.push(`return ${returnVar}`);
                break;

            case 'Expression': {
                const leftVar = this.generate(node.children[0], symbolTable, scope);
                const rightVar = this.generate(node.children[1], symbolTable, scope);
                const resultTemp = this.newTempVar();
                this.instructions.push(`${resultTemp} = ${leftVar} ${node.value} ${rightVar}`);
                return resultTemp;
            }

            case 'Identifier':
                return node.value;

            case 'Number':
                return node.value;

            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    getTAC() {
        return this.instructions.join('\n');
    }
}

export function generateThreeAddressCode(parseTree, symbolTable) {
    const tacGenerator = new ThreeAddressCodeGenerator();
    tacGenerator.generate(parseTree, symbolTable);
    return tacGenerator.getTAC();
}