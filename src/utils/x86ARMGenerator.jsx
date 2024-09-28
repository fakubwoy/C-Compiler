class X86AssemblyGenerator {
    constructor() {
      this.assembly = [];
      this.currentFunction = '';
      this.variables = new Map();
      this.stackOffset = 0;
    }
  
    generateAssembly(tac) {
      console.log("Generating assembly for TAC:", tac);
      const lines = tac.split('\n');
      this.assembly.push('global main');
      this.assembly.push('section .text');
      lines.forEach(line => {
        console.log("Processing line:", line);
        this.processLine(line.trim());
      });
      console.log("Final assembly:", this.assembly.join('\n'));
      return this.assembly.join('\n');
    }
  
    processLine(line) {
      const parts = line.match(/(\w+|\S)/g);
      
      if (!parts || parts.length === 0) {
        return;
      }
      
      if (parts[0] === 'func') {
        this.processFunctionStart(parts[1].replace('{', ''));
      } else if (line === '}') {
        this.processFunctionEnd();
      } else if (parts[0] === 'return') {
        this.processReturn(parts[1]);
      } else if (parts.includes('=')) {
        const eqIndex = parts.indexOf('=');
        const target = parts[0];
        const value = parts[2];
        this.processAssignment(target, value);
      } else if (parts.length === 5) {
        this.processOperation(parts[0], parts[2], parts[3], parts[4]);
      }
    }
  
    processFunctionStart(functionName) {
      console.log("Starting function:", functionName);
      this.currentFunction = functionName;
      this.assembly.push(`${this.currentFunction}:`);
      this.assembly.push('    push rbp');
      this.assembly.push('    mov rbp, rsp');
      this.stackOffset = 0;
    }
  
    processFunctionEnd() {
      console.log("Ending function");
    }
  
    processReturn(value) {
      console.log("Processing return:", value);
      if (value) {
        if (this.variables.has(value)) {
          console.log("Returning variable:", value);
          const offset = this.variables.get(value);
          this.assembly.push(`    mov eax, [rbp-${offset}]`);
        } else if (!isNaN(value)) {
          console.log("Returning immediate value:", value);
          this.assembly.push(`    mov eax, ${value}`);
        }
      }
      this.assembly.push('    mov rsp, rbp');
      this.assembly.push('    pop rbp');
      this.assembly.push('    ret');
    }
  
    processAssignment(target, value) {
      console.log("Processing assignment:", target, "=", value);
      if (!this.variables.has(target)) {
        this.stackOffset += 4;
        this.variables.set(target, this.stackOffset);
      }
      const offset = this.variables.get(target);
      
      if (!isNaN(value)) {
        console.log("Assigning immediate value");
        this.assembly.push(`    mov dword [rbp-${offset}], ${value}`);
      } else if (this.variables.has(value)) {
        console.log("Assigning variable value");
        const sourceOffset = this.variables.get(value);
        this.assembly.push(`    mov eax, [rbp-${sourceOffset}]`);
        this.assembly.push(`    mov [rbp-${offset}], eax`);
      } else {
        console.log("Unknown value in assignment:", value);
        this.assembly.push(`    ; Error: Unknown value ${value}`);
      }
    }
  
    processOperation(result, left, op, right) {
      console.log("Processing operation:", result, "=", left, op, right);
      if (!this.variables.has(result)) {
        this.stackOffset += 4;
        this.variables.set(result, this.stackOffset);
      }
      const resultOffset = this.variables.get(result);

      if (isNaN(left)) {
        const leftOffset = this.variables.get(left);
        this.assembly.push(`    mov eax, [rbp-${leftOffset}]`);
      } else {
        this.assembly.push(`    mov eax, ${left}`);
      }

      let instruction;
      switch (op) {
        case '+': instruction = 'add'; break;
        case '-': instruction = 'sub'; break;
        case '*': instruction = 'imul'; break;
        case '/': 
          this.assembly.push('    mov edx, 0');
          if (isNaN(right)) {
            const rightOffset = this.variables.get(right);
            this.assembly.push(`    mov ecx, [rbp-${rightOffset}]`);
          } else {
            this.assembly.push(`    mov ecx, ${right}`);
          }
          this.assembly.push('    div ecx');
          this.assembly.push(`    mov [rbp-${resultOffset}], eax`);
          return;
        default: throw new Error(`Unsupported operation: ${op}`);
      }

      if (instruction) {
        if (isNaN(right)) {
          const rightOffset = this.variables.get(right);
          this.assembly.push(`    ${instruction} eax, [rbp-${rightOffset}]`);
        } else {
          this.assembly.push(`    ${instruction} eax, ${right}`);
        }
      }
      
      this.assembly.push(`    mov [rbp-${resultOffset}], eax`);
    }
  }
  
  export function generateX86Assembly(optimizedTAC) {
    console.log("generateX86Assembly called with:", optimizedTAC);
    const generator = new X86AssemblyGenerator();
    return generator.generateAssembly(optimizedTAC);
  }
