'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, loading } = useAuth();

  // Password strength indicator
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'text-muted' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;

    if (score === 0) return { score: 0, label: '', color: 'text-muted' };
    if (score === 1) return { score: 1, label: 'Weak', color: 'text-error' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'text-warning' };
    if (score === 3) return { score: 3, label: 'Good', color: 'text-success' };
    return { score: 4, label: 'Strong', color: 'text-success' };
  }, [password]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak. Use uppercase, lowercase, numbers, and symbols.');
      return;
    }

    try {
      await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* Heading */}
      <div className="space-y-2 text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Create Account</h2>
        <p className="text-sm text-muted">Join TSplineForge and start creating</p>
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
        hint="We'll use this to sign in to your account"
      />

      {/* Password Input */}
      <div className="space-y-2">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
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

        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    i <= passwordStrength.score
                      ? passwordStrength.color === 'text-error'
                        ? 'bg-error'
                        : passwordStrength.color === 'text-warning'
                          ? 'bg-warning'
                          : 'bg-success'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <div className={`text-xs font-medium ${passwordStrength.color}`}>
              {passwordStrength.label && `Password strength: ${passwordStrength.label}`}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
          error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          }
        />
        {passwordsMatch && (
          <div className="text-xs text-success flex items-center gap-1">
            ✓ Passwords match
          </div>
        )}
      </div>

      {/* Terms & Conditions */}
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border border-border bg-card checked:bg-primary checked:border-primary cursor-pointer transition-colors mt-0.5"
          required
        />
        <span className="text-xs text-foreground">
          I agree to the{' '}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </span>
      </label>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        isLoading={loading}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card text-muted">Or sign up with</span>
        </div>
      </div>

      {/* Social Login Buttons */}
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
