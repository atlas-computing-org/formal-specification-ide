import path from 'path';

/**
 * Validates and sanitizes a file path to prevent path traversal attacks
 * @param userPath - The user-provided path
 * @param baseDir - The base directory that the path must be within
 * @returns The sanitized absolute path if valid, null if invalid
 */
export function validateAndSanitizePath(userPath: string, baseDir: string): string | null {
  if (!userPath || typeof userPath !== 'string') {
    return null;
  }

  // Remove any null bytes or control characters
  const cleanPath = userPath.replace(/[\x00-\x1f\x7f]/g, '');
  
  // Check for path traversal attempts
  if (cleanPath.includes('..') || cleanPath.includes('//')) {
    return null;
  }

  // Resolve the path relative to base directory
  const resolvedPath = path.resolve(baseDir, cleanPath);
  
  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    return null;
  }

  // Normalize the path to remove any remaining problematic sequences
  const normalizedPath = path.normalize(resolvedPath);
  
  // Final check to ensure it's still within base directory
  if (!normalizedPath.startsWith(path.resolve(baseDir))) {
    return null;
  }

  return normalizedPath;
}

/**
 * Validates a dataset name to ensure it only contains safe characters
 * @param datasetName - The dataset name to validate
 * @returns true if valid, false otherwise
 */
export function validateDatasetName(datasetName: string): boolean {
  if (!datasetName || typeof datasetName !== 'string') {
    return false;
  }

  // Only allow alphanumeric characters, hyphens, and underscores
  const safePattern = /^[a-zA-Z0-9_-]+$/;
  return safePattern.test(datasetName);
}

/**
 * Validates a filename to ensure it only contains safe characters and extensions
 * @param filename - The filename to validate
 * @param allowedExtensions - Array of allowed file extensions
 * @returns true if valid, false otherwise
 */
export function validateFilename(filename: string, allowedExtensions: string[] = ['.txt', '.json', '.pdf']): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // Only allow alphanumeric characters, hyphens, underscores, and dots
  const safePattern = /^[a-zA-Z0-9_.-]+$/;
  if (!safePattern.test(filename)) {
    return false;
  }

  // Check if file has an allowed extension
  const hasAllowedExtension = allowedExtensions.some(ext => filename.endsWith(ext));
  if (!hasAllowedExtension) {
    return false;
  }

  return true;
}
