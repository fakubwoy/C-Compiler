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
- [ ] Syntax analysis / parse tree generation (Partially done)
   - [x] Generation of parse Tree
   - [x] Assign rules:
      - [x] Make sure every statement ends with ;
      - [x] Make sure the code is contained in 'int main()'
      - [x] Make sure the variable declaration follows the expression: type name = value, where the value can be an expression as well
   - [x] Parse the tree making sure these rules are followed
   - [ ] If at any point a rule is not followed stop compilation and display the error.
- [x] Semantic analysis
- [x] Symbol table generation
- [x] Three address code generation
- [ ] Optimization of TAC
- [ ] Generation of x86 ASM
