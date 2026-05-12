// Shared in-memory user database for auth
// In production, this should be a real database (PostgreSQL, MongoDB, etc.)

export interface StoredUser {
  password: string;
  id: string;
  role: string;
}

// Shared user store - accessible from both login and register endpoints
export const users: Record<string, StoredUser> = {
  'demo@example.com': {
    password: 'password123',
    id: 'user_1',
    role: 'admin',
  },
};

// User management functions
export function getUserByEmail(email: string): StoredUser | undefined {
  return users[email];
}

export function createUser(email: string, password: string, userId: string): void {
  users[email] = {
    password,
    id: userId,
    role: 'user',
  };
}

export function userExists(email: string): boolean {
  return !!users[email];
}
