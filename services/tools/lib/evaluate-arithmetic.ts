/**
 * Safe arithmetic expression evaluator: +, -, *, /, parentheses, decimals,
 * and unary +/-. Deliberately does NOT use `eval`/`new Function` — it's a
 * small recursive-descent parser so arbitrary code can never execute even
 * though the expression string ultimately comes from the model.
 */

class ArithmeticError extends Error {}

export function evaluateArithmetic(expression: string): number {
  const tokens = tokenize(expression);
  let position = 0;

  function peek(): string | undefined {
    return tokens[position];
  }

  function next(): string {
    const token = tokens[position];
    if (token === undefined) throw new ArithmeticError("Unexpected end of expression.");
    position += 1;
    return token;
  }

  function parseExpression(): number {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseUnary();
    while (peek() === "*" || peek() === "/") {
      const op = next();
      const rhs = parseUnary();
      if (op === "/" && rhs === 0) throw new ArithmeticError("Division by zero.");
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }

  function parseUnary(): number {
    if (peek() === "-") {
      next();
      return -parseUnary();
    }
    if (peek() === "+") {
      next();
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const token = next();
    if (token === "(") {
      const value = parseExpression();
      if (next() !== ")") throw new ArithmeticError("Missing closing parenthesis.");
      return value;
    }
    const value = Number(token);
    if (Number.isNaN(value)) throw new ArithmeticError(`Unexpected token "${token}".`);
    return value;
  }

  const result = parseExpression();
  if (position !== tokens.length) {
    throw new ArithmeticError(`Unexpected token "${tokens[position]}".`);
  }
  if (!Number.isFinite(result)) {
    throw new ArithmeticError("Result is not a finite number.");
  }
  return result;
}

function tokenize(expression: string): string[] {
  const pattern = /\s*(\d+(?:\.\d+)?|[()+\-*/])\s*/g;
  const tokens: string[] = [];
  let position = 0;

  while (position < expression.length) {
    pattern.lastIndex = position;
    const match = pattern.exec(expression);
    if (!match || match.index !== position) {
      throw new ArithmeticError(`Unexpected character at position ${position}.`);
    }
    tokens.push(match[1]);
    position += match[0].length;
  }

  return tokens;
}
