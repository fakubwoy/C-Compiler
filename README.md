# C-Compiler

## Steps to Run the Project

# 1. Clone the repository:
git clone https://github.com/fakubwoy/C-Compiler.git

# 2. Change directory into the project:
cd C-Compiler

# 3. Install the dependencies:
npm install
cd server
npm install
cd ..

# 4. Start the development server:
npm run dev

# Running the Generated Executable
# Once you have compiled your assembly code through the /compile endpoint, follow these steps to run the downloaded executable on a Windows machine.

# 1. Download the Executable:
# After compiling, you’ll receive a file named output.exe. Save this file in a known directory.

# 2. Run the Executable:
# Open a Command Prompt, navigate to the directory where output.exe is saved, and run the executable by entering:
# output.exe
# Alternatively, you can double-click the file in File Explorer to execute it.

# 3. Verify Output:
# The executable should perform the intended operations defined by the original assembly code. Check the Command Prompt window or any output files for results.

# To-Do List

# 1. Documentation
# - [x] Create comprehensive code documentation
# - [x] Add usage examples and installation steps

# 2. Lexical Analysis
# - [x] Preprocessing
# - [x] Tokenization
#   - [ ] Add support for more data types
#   - [ ] Handle additional print/output statements

# 3. Syntax Analysis (Parse Tree Generation)
# - [x] Parse Tree Generation
# - [x] Rule Assignments:
#   - [x] Ensure every statement ends with ;
#   - [x] Enclose the code inside int main()
#   - [x] Validate variable declarations follow:
#     type name = value (where value can be an expression)
#   - [ ] Define and implement additional syntax rules

# - [x] Parse Tree Validation:
#   - [x] Enforce rule compliance during parsing
#   - [x] Stop compilation and display an error on rule violation

# 4. Semantic Analysis
# - [x] Perform semantic checks
# - [x] Generate symbol table

# 5. Intermediate Code Generation
# - [x] Generate Three-Address Code (TAC)
# - [x] Optimize TAC

# 6. Assembly and Compilation
# - [x] Generate x86 Assembly code
# - [x] Compile ASM to executable (.exe)

# 7. Chatbot Integration
# - [x] Build chatbot framework
# - [ ] Choose an appropriate NLP/AI model
# - [x] Integrate model into the chatbot for interaction
# - [ ] Test for natural responses and error handling
