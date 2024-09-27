export function optimizeTAC(tac) {
    const lines = tac.split('\n').map(line => line.trim());
    const variables = {};
    const dependencies = {};
    const optimizedLines = [];
    let inFunction = false;
    let returnVar = null;
  
    const isFullyEvaluated = (expr) => {
      try {
        const result = eval(expr);
        return !isNaN(result);
      } catch {
        return false;
      }
    };
  
    const propagateVariable = (varName) => {
      if (dependencies[varName]) {
        const expr = dependencies[varName].map(dep => variables[dep] || dep).join(' ');
        if (isFullyEvaluated(expr)) {
          variables[varName] = eval(expr);
          return true;
        }
      }
      return false;
    };
  
    lines.forEach(line => {
      if (line.startsWith('func')) {
        inFunction = true;
        optimizedLines.push(line);
        return;
      }
  
      if (line === '}') {
        inFunction = false;
        if (returnVar !== null) {
          propagateVariable(returnVar);
          optimizedLines.push(`${returnVar}=${variables[returnVar] || dependencies[returnVar].join(' ')}`);
          optimizedLines.push(`return ${returnVar}`);
        }
        optimizedLines.push('}');
        return;
      }
  
      if (!inFunction) {
        optimizedLines.push(line);
        return;
      }
  
      if (line.startsWith('return')) {
        returnVar = line.split(' ')[1];
        return;
      }
  
      const parts = line.split('=').map(part => part.trim());
      if (parts.length !== 2) {
        optimizedLines.push(line);
        return;
      }
  
      const [left, right] = parts;
      const rightTokens = right.split(/\s+/);
  
      dependencies[left] = rightTokens;
  
      if (isFullyEvaluated(right)) {
        variables[left] = eval(right);
      } else {
        variables[left] = right;
      }
  
      Object.keys(dependencies).forEach(propagateVariable);
    });
  
    return optimizedLines.join('\n');
  }