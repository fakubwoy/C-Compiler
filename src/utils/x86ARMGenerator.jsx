class X86AssemblyGenerator {
    constructor() {
      this.assembly = [];
      this.dataSection = [];
      this.textSection = [];
      this.currentFunction = '';
      this.variables = new Map();
      this.stackOffset = 0;
      this.dataCounter = 0;
    }
  
    generateAssembly(tac) {
      console.log("Generating assembly for TAC:", tac);
      const lines = tac.split('\n');
      this.dataSection.push('section .data');
      this.textSection.push('section .text');
      this.textSection.push('global _start');
  
      lines.forEach(line => {
        this.processLine(line.trim());
      });
  
      this.assembly = [...this.dataSection, ...this.textSection];
      return this.assembly.join('\n');
    }
  
    processLine(line) {
      const parts = line.match(/(\w+|\S)/g);
      if (!parts || parts.length === 0) return;
  
      if (parts[0] === 'func') {
        this.processFunctionStart(parts[1].replace('{', ''));
      } else if (line === '}') {
        this.processFunctionEnd();
      } else if (parts[0] === 'return') {
        this.processReturn(parts[1]);
      } else if (parts.includes('=')) {
        const eqIndex = parts.indexOf('=');
        const target = parts[0];
        const value = parts.slice(eqIndex + 1).join(' ');
        this.processAssignment(target, value);
      }
    }
  
    processFunctionStart(functionName) {
      if (functionName === 'main') {
        this.currentFunction = '_start';
      } else {
        this.currentFunction = functionName;
      }
      this.textSection.push(`${this.currentFunction}:`);
    }
  
    processFunctionEnd() {
      this.textSection.push('    mov rax, 60');
      this.textSection.push('    xor rdi, rdi');
      this.textSection.push('    syscall');
    }
  
    processReturn(value) {
      if (!isNaN(value)) {
        this.handleSyscall(value);
      }
    }
  
    processAssignment(target, value) {
      if (!isNaN(value)) {
        this.handleSyscall(value);
      }
    }
  
    handleSyscall(value) {
      const label = `val${this.dataCounter++}`;
      const stringValue = value.toString(); 
      const length = stringValue.length + 1; 
  
      this.dataSection.push(`    ${label} db '${stringValue}', 0xA`);
  
      this.textSection.push('    mov rax, 1'); 
      this.textSection.push('    mov rdi, 1'); 
      this.textSection.push(`    mov rsi, ${label}`); 
      this.textSection.push(`    mov rdx, ${length}`);
      this.textSection.push('    syscall');
    }
  }
  
  export function generateX86Assembly(optimizedTAC) {
    const generator = new X86AssemblyGenerator();
    return generator.generateAssembly(optimizedTAC);
  }
  