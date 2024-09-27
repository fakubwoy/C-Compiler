class OptimizedTACGenerator {
    constructor(tacInstructions) {
        this.instructions = tacInstructions.split('\n');
        this.optimizedInstructions = [];
    }

    optimize() {
        this.constantFolding();
        return this.optimizedInstructions.join('\n');
    }

    // Constant folding optimization
    constantFolding() {
        this.instructions.forEach(instruction => {
            const match = instruction.match(/t\d+ = (\d+) (\+|\-|\*|\/) (\d+)/);

            if (match) {
                const [_, leftOperand, operator, rightOperand] = match;
                const result = this.evaluateConstantExpression(parseInt(leftOperand), operator, parseInt(rightOperand));
                this.optimizedInstructions.push(instruction.replace(/t\d+ = .*/, `t = ${result}`));
            } else {
                this.optimizedInstructions.push(instruction);
            }
        });
    }

    evaluateConstantExpression(left, operator, right) {
        switch (operator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return left / right;
            default:
                return NaN;
        }
    }
}

export function optimizeThreeAddressCode(tacCode) {
    const optimizer = new OptimizedTACGenerator(tacCode);
    return optimizer.optimize();
}
