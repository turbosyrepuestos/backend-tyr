# Agent Guidelines — backend-tyr

These rules apply to all AI agents (Copilot, Gemini, Cursor, etc.) that generate or modify code in this repository.

---

## ❌ Never use `any`

**Do not use the `any` type anywhere in the codebase.**

The ESLint config enables `@typescript-eslint/recommendedTypeChecked`, which flags unsafe `any` usage as an error. Using `any` defeats TypeScript's type safety and introduces runtime bugs that the compiler cannot catch.

### Common patterns to avoid and their correct replacements

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `const query: any = {}` | `const query: QueryFilter<MyDocument> = {}` |
| `const sort: any = {}` | `const sort: Record<string, SortOrder> = {}` |
| `dto?: any` (class constructor) | `dto?: abstract new (...args: unknown[]) => unknown` |
| `({ value }) => value` in `@Transform` | `({ value }: { value: unknown }) => value as TargetType` |
| Untyped catch clause variable | `catch (error: unknown)` |

### Mongoose query objects

Always use Mongoose's built-in utility types:

```typescript
import { QueryFilter, Model, SortOrder } from 'mongoose';

const query: QueryFilter<MyDocument> = {};
const sort: Record<string, SortOrder> = {};
```

### Unknown values from external input

Use `unknown` instead of `any` when the type cannot be determined at compile time, then narrow it with type guards:

```typescript
function handle(value: unknown): string {
  if (typeof value === 'string') return value;
  throw new Error('Expected string');
}
```

---

## ⚠️ No floating promises

Always await promises or mark them intentionally with `void`:

```typescript
// ✅ Awaited
await bootstrap();

// ✅ Intentionally fire-and-forget
void bootstrap();

// ❌ Floating promise — will trigger lint error
bootstrap();
```

---

## General TypeScript rules

- Prefer explicit return types on public service methods.
- Use `readonly` on constructor-injected dependencies.
- Do not use `@ts-ignore` or `@ts-expect-error` without a written justification comment.
- Run `pnpm run lint` before committing to catch any violations.
