import { Request } from 'express';

/**
 * Safely gets a user from a request with type safety
 * @param req Express request object 
 * @returns The authenticated user, throws if not present
 */
export function getAuthUser(req: Request): Express.User {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user;
}

/**
 * A type-safe wrapper for req.user.id
 * @param req Express request object
 * @returns The authenticated user ID
 */
export function getUserId(req: Request): number {
  return getAuthUser(req).id;
}