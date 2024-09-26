export function preprocessCode(code) {
    const noSingleLineComments = code.replace(/\/\/.*$/gm, '');

    const noMultiLineComments = noSingleLineComments.replace(/\/\*[\s\S]*?\*\//g, '');

    const noHeaders = noMultiLineComments.replace(/^\s*#include\s*<.*?>\s*$/gm, '');

    return noHeaders.trim();
}