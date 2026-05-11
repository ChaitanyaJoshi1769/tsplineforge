'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-subtle">
        <div className="text-center space-y-4 animate-fadeIn">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" />
            <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-secondary opacity-50 animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
          <p className="text-muted text-sm font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      logo={
        <div className="text-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 backdrop-blur-sm mb-4">
            <span className="text-2xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              ✧
            </span>
          </div>
        </div>
      }
      branding={
        <div className="text-center space-y-2 animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            TSplineForge
          </h1>
          <p className="text-sm text-muted font-medium">
            Professional CAD for the modern builder
          </p>
        </div>
      }
      footer={
        <div className="text-xs text-muted/60 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          © 2026 TSplineForge Labs. Crafted with precision.
        </div>
      }
    >
      <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
        {/* Tab Navigation - Premium Styling */}
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-card border border-border rounded-xl p-1">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-lg font-semibold transition-all duration-200"
          >
            Sign In
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-lg font-semibold transition-all duration-200"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        {/* Login Tab */}
        <TabsContent value="login" className="animate-fadeIn">
          <LoginForm />
          <div className="mt-6 text-center text-sm space-y-3">
            <div className="text-muted">
              Don't have an account?{' '}
              <button
                onClick={() => setActiveTab('register')}
                className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200 relative group"
              >
                Create one
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-primary/60 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Register Tab */}
        <TabsContent value="register" className="animate-fadeIn">
          <RegisterForm />
          <div className="mt-6 text-center text-sm space-y-3">
            <div className="text-muted">
              Already have an account?{' '}
              <button
                onClick={() => setActiveTab('login')}
                className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200 relative group"
              >
                Sign in
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-primary/60 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
