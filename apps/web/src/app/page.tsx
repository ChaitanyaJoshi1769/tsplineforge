'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useState } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [_activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-subtle">
        <div className="text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      logo={
        <div className="text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            ✦
          </div>
        </div>
      }
      branding={
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">TSplineForge</h1>
          <p className="mt-2 text-sm text-muted">
            AI-powered mesh-to-T-Spline CAD platform
          </p>
        </div>
      }
      footer={
        <div className="text-xs text-muted">
          © 2026 TSplineForge. All rights reserved.
        </div>
      }
    >
      <Tabs defaultValue="login" onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="register">Sign Up</TabsTrigger>
        </TabsList>

        {/* Login Tab */}
        <TabsContent value="login">
          <LoginForm />
          <div className="mt-6 text-center text-sm text-muted">
            Don't have an account?{' '}
            <button
              onClick={() => setActiveTab('register')}
              className="text-primary hover:underline font-medium transition-colors"
            >
              Create one
            </button>
          </div>
        </TabsContent>

        {/* Register Tab */}
        <TabsContent value="register">
          <RegisterForm />
          <div className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <button
              onClick={() => setActiveTab('login')}
              className="text-primary hover:underline font-medium transition-colors"
            >
              Sign in
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
