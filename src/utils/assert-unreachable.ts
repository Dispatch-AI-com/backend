// utils/assert-unreachable.ts
export function assertUnreachable(x: never): never {
  throw new Error(`Unhandled value: ${String(x)}`);
}
