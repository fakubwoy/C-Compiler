# C-Compiler

## Steps to Run the Project

1. Clone the repository:
   ```bash
   git clone https://github.com/fakubwoy/C-Compiler.git
   ```

2. Change directory into the project:
   ```bash
   cd C-Compiler
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## ToDo

- [ ] Make documentation for code
- [x] Preprocessing
- [x] Lexical analysis
- [x] Syntax analysis / parse tree generation (TODO: assigning rules, using recursive descent parsing or any parsing of choice to check syntax,proper exception handling,i.e, display statement like 'expected ; at the end of statement 3' 'improper type assigned to y', etc)
- [x] Semantic analysis
- [x] Symbol table generation
- [ ] Three address code generation
- [ ] Optimization of TAC
- [ ] Generation of x86 ASM
