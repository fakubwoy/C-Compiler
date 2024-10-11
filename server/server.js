// server/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/compile', (req, res) => {
    const asmCode = req.body.code;

    // Write the assembly code to a file
    fs.writeFileSync('temp.asm', asmCode);

    // Compile the assembly code using nasm and ld
    exec('nasm -f elf64 temp.asm && ld -o output temp.o', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${stderr}`);
            return res.status(500).send('Compilation error');
        }

        // Send the compiled executable back to the client
        res.download('output', 'output', (err) => {
            if (err) {
                console.error(err);
            }

            // Clean up generated files
            fs.unlinkSync('temp.asm');
            fs.unlinkSync('output');
            fs.unlinkSync('temp.o');
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
