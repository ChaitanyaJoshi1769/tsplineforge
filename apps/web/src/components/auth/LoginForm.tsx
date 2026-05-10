'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* Heading */}
      <div className="space-y-2 text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Welcome Back</h2>
        <p className="text-sm text-muted">Sign in to your TSplineForge account</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant="error"
          description={error}
          onClose={() => setError('')}
        />
      )}

      {/* Email Input */}
      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        hint="We'll never share your email."
      />

      {/* Password Input */}
      <div className="space-y-2">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          }
        />
        <div className="flex justify-end">
          <a href="#" className="text-xs text-primary hover:underline transition-colors">
            Forgot password?
          </a>
        </div>
      </div>

      {/* Remember Me */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border border-border bg-card checked:bg-primary checked:border-primary cursor-pointer transition-colors"
          defaultChecked
        />
        <span className="text-sm text-foreground">Remember me</span>
      </label>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        isLoading={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Social Login Buttons */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card text-muted">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => {}}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => {}}
        >
          GitHub
        </Button>
      </div>
    </form>
  );
}
