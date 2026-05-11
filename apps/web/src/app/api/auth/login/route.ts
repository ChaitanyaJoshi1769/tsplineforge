import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory user database (demo purposes - use real DB in production)
const users: Record<string, { password: string; id: string; role: string }> = {
  'demo@example.com': {
    password: 'password123',
    id: 'user_1',
    role: 'admin',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check user exists
    const user = users[email];
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token (simplified - use jsonwebtoken library in production)
    const token = crypto.randomBytes(32).toString('hex');

    return NextResponse.json(
      {
        token,
        id: user.id,
        email,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
