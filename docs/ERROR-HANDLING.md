# Error Handling in tRPC

## Overview

The application includes a comprehensive error handling system that provides detailed error information during development while maintaining security in production.

---

## Error Formatter

**Location**: [`src/server/trpc/init.ts`](../src/server/trpc/init.ts)

The tRPC initialization includes a custom error formatter that:

1. **Development Mode** (`NODE_ENV=development`):
   - Logs detailed errors to the console with grouping
   - Includes full stack traces
   - Shows error causes and original errors
   - Displays procedure path where error occurred
   - Formats errors based on type (TRPCError, Prisma, standard Error)

2. **Production Mode**:
   - Only logs basic error information
   - Strips sensitive details from client responses
   - Maintains security and privacy

### Error Response Structure

In development, error responses include:
```typescript
{
  message: string;
  code: string;
  data: {
    code: string;
    httpStatus: number;
    path: string;
    stack?: string;           // Development only
    cause?: unknown;          // Development only
    originalError?: {         // Development only
      name: string;
      message: string;
      stack: string;
    }
  }
}
```

---

## Error Logger Utility

**Location**: [`src/server/trpc/errorLogger.ts`](../src/server/trpc/errorLogger.ts)

### `logError(error, context?)`

Logs errors with detailed information based on error type.

**Features:**
- Grouped console output with emoji indicator 🚨
- Detects error type automatically (TRPCError, Prisma, standard Error)
- Shows relevant properties for each error type
- Includes context information (e.g., procedure name)

**Example Output:**
```
🚨 [tRPC Error] Procedure: timetable.list
  Type: TRPCError
  Code: UNAUTHORIZED
  Message: No session token provided
```

### `formatPrismaError(error)`

Converts Prisma error codes to user-friendly messages.

**Common Prisma Errors:**
- `P2002`: Unique constraint violation
- `P2003`: Foreign key constraint failed
- `P2025`: Record not found
- `P2014`: Required relation violation
- `P2016`: Query interpretation error
- `P2021`: Table does not exist

### `withErrorLogging(fn, context?)`

Wrapper function that adds error logging to async functions.

**Usage:**
```typescript
const myFunction = withErrorLogging(
  async (id: string) => {
    // Your code here
  },
  'myFunction'
);
```

---

## Error Types

### 1. TRPCError

Standard tRPC errors with predefined codes.

**Common Codes:**
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `BAD_REQUEST` (400): Invalid input
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error

**Example:**
```typescript
throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'Invalid session token',
  cause: originalError
});
```

### 2. Prisma Errors

Database-related errors from Prisma Client.

**Example:**
```typescript
// Caught automatically and formatted
await prisma.user.create({
  data: { email: 'duplicate@email.com' } // P2002 error
});
```

### 3. Standard JavaScript Errors

Regular Error objects are also properly logged.

**Example:**
```typescript
throw new Error('Something went wrong');
```

---

## Development Console Output

When an error occurs in development, you'll see:

```
🚨 [tRPC Error] Procedure: auth.login
  Type: TRPCError
  Code: UNAUTHORIZED
  Message: Invalid credentials
  Cause: Error: Password does not match
    at verifyPassword (auth.ts:123)
    ...
```

---

## Best Practices

### 1. Use Specific Error Codes

```typescript
// ❌ Bad
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Failed'
});

// ✅ Good
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Timetable not found'
});
```

### 2. Include Context in Error Messages

```typescript
// ❌ Bad
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'Access denied'
});

// ✅ Good
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'Cannot access timetable from another organization'
});
```

### 3. Preserve Error Causes

```typescript
// ✅ Good
try {
  await someOperation();
} catch (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Operation failed',
    cause: error  // Preserves original error
  });
}
```

### 4. Handle Prisma Errors Gracefully

```typescript
import { formatPrismaError } from '@/server/trpc/errorLogger';

try {
  await prisma.user.create({ data });
} catch (error) {
  if (isPrismaError(error)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: formatPrismaError(error),
      cause: error
    });
  }
  throw error;
}
```

---

## Frontend Error Handling

Errors are automatically caught by TanStack Query and can be handled in the UI:

```typescript
const { mutate, error } = useMutation({
  ...trpc.someEndpoint.mutationOptions(),
  onError: (error) => {
    // error.message contains user-friendly message
    console.error('Operation failed:', error.message);
    
    // In development, additional details are available
    if (error.data?.stack) {
      console.error('Stack trace:', error.data.stack);
    }
  }
});
```

---

## Testing Error Scenarios

### 1. Authentication Errors

```bash
# Test without session token
curl http://localhost:3000/api/trpc/timetable.list

# Expected: UNAUTHORIZED error
```

### 2. Permission Errors

```bash
# Test with viewer role trying to create
# Expected: FORBIDDEN error
```

### 3. Not Found Errors

```bash
# Test with invalid timetable ID
# Expected: NOT_FOUND error
```

### 4. Validation Errors

```bash
# Test with invalid input
# Expected: BAD_REQUEST error
```

---

## Environment Variables

The error handling behavior is controlled by `NODE_ENV`:

```bash
# Development (detailed errors)
NODE_ENV=development npm run dev

# Production (sanitized errors)
NODE_ENV=production npm start
```

---

## Troubleshooting

### Issue: Not seeing detailed errors

**Solution**: Ensure `NODE_ENV=development` is set

```bash
# Check current environment
echo $NODE_ENV

# Set for current session
export NODE_ENV=development
```

### Issue: Errors not logged to console

**Solution**: Check if the error is being caught somewhere else without re-throwing

### Issue: Stack traces are truncated

**Solution**: Increase Node.js stack trace limit

```bash
node --stack-trace-limit=100 your-app.js
```

---

## Security Considerations

### Production Safety

The error handler automatically:
- Strips stack traces in production
- Removes error causes
- Sanitizes error messages
- Prevents information leakage

### Development Tips

- Never commit code with production `NODE_ENV` hardcoded
- Use environment-specific configuration files
- Review error messages for sensitive information
- Test error responses in production mode before deployment

---

## Example: Complete Error Handling Pattern

```typescript
import { TRPCError } from '@trpc/server';
import { editorProcedure } from '../init';
import { verifyTimetableOwnership } from '../utils/verifyTimetableOwnership';
import { logError, formatPrismaError } from '../errorLogger';

export const exampleRouter = {
  createItem: editorProcedure
    .input(z.object({
      timetableId: z.string(),
      name: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify access
        await verifyTimetableOwnership(ctx, input.timetableId);
        
        // Create item
        const item = await ctx.prisma.item.create({
          data: {
            name: input.name,
            timetableId: input.timetableId
          }
        });
        
        return { item };
        
      } catch (error) {
        // Prisma errors
        if (isPrismaError(error)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: formatPrismaError(error),
            cause: error
          });
        }
        
        // TRPCError - re-throw as-is
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Unknown errors
        logError(error, 'createItem');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create item',
          cause: error
        });
      }
    })
};
```

---

## Summary

The error handling system provides:
- ✅ Detailed development debugging
- ✅ Production security
- ✅ Type-safe error responses
- ✅ User-friendly error messages
- ✅ Comprehensive error logging
- ✅ Prisma error formatting
- ✅ Automatic error detection and formatting

This ensures a smooth development experience while maintaining security in production.