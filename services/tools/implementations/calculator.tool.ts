import { z } from "zod";
import type { ITool } from "../tools.interface";
import { evaluateArithmetic } from "../lib/evaluate-arithmetic";

const parameters = z.object({
  expression: z
    .string()
    .describe('A basic arithmetic expression, e.g. "12 * (3 + 4)" or "(100 - 15) / 4".'),
});

export const calculatorTool: ITool<z.infer<typeof parameters>> = {
  name: "calculator",
  description:
    "Evaluates a basic arithmetic expression (+, -, *, /, parentheses) and returns the numeric " +
    "result. Use this for any math the user asks about instead of computing it yourself.",
  parameters,
  async execute({ expression }) {
    try {
      const result = evaluateArithmetic(expression);
      return `${expression} = ${result}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not evaluate the expression.";
      return `Error evaluating "${expression}": ${message}`;
    }
  },
};
