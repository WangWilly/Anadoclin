////////////////////////////////////////////////////////////////////////////////

// TODO: predefined exceptions for reusability

////////////////////////////////////////////////////////////////////////////////

/**
 * Type for the result of a safe operation
 */
export type SafeResult<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };

/**
 * Safely execute a promise and return a standardized result
 * @param promise The promise to execute
 * @returns A result object indicating success or failure
 */
export async function safe<T>(promise: Promise<T>): Promise<SafeResult<T>> {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}
