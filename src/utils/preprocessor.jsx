export function preprocessCode(code) {
    const headers = [];
    const lines = code.split('\n');
    let totalHeaderLines = 0;

    const noSingleLineComments = code.replace(/\/\/.*$/gm, '');
    const noMultiLineComments = noSingleLineComments.replace(/\/\*[\s\S]*?\*\//g, '');

    lines.forEach((line, index) => {
        const headerMatch = line.match(/^\s*#include\s*<(.*?)>\s*$/);
        if (headerMatch) {
            headers.push({ header: headerMatch[1], line: index + 1 });
            totalHeaderLines += 1; 
        }
    });

    const noHeaders = noMultiLineComments.replace(/^\s*#include\s*<.*?>\s*$/gm, '');
    return { code: noHeaders.trim(), headers, totalHeaderLines };
}
