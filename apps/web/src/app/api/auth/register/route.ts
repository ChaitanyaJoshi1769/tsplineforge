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
    const { email, password, confirmPassword } = await request.json();

    // Validate input
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Email, password, and confirm password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check user doesn't already exist
    if (users[email]) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create new user
    const userId = `user_${crypto.randomBytes(8).toString('hex')}`;
    users[email] = {
      password,
      id: userId,
      role: 'user',
    };

    // Generate JWT token (simplified)
    const token = crypto.randomBytes(32).toString('hex');

    return NextResponse.json(
      {
        token,
        id: userId,
        email,
        role: 'user',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
