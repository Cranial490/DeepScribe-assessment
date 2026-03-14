/**
 * Ensures discriminated unions are handled exhaustively in switch statements.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`)
}
