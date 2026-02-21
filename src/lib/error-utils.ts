/**
 * Maps raw database/API errors to safe user-facing messages.
 * Full error details are logged to console for debugging.
 */
export function mapErrorToUserMessage(error: unknown): string {
  const message = (error as any)?.message?.toLowerCase() || '';

  if (import.meta.env.DEV) {
    console.error('Operation error:', error);
  }

  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'This record already exists. Please use a different value.';
  }
  if (message.includes('foreign key')) {
    return 'Cannot complete this operation due to related records.';
  }
  if (message.includes('row-level security') || message.includes('rls')) {
    return 'You do not have permission to perform this action.';
  }
  if (message.includes('violates check constraint')) {
    return 'The provided data does not meet the required format.';
  }
  if (message.includes('not found') || message.includes('no rows')) {
    return 'The requested record was not found.';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'The operation timed out. Please try again.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'A network error occurred. Please check your connection.';
  }

  return 'An unexpected error occurred. Please try again.';
}
