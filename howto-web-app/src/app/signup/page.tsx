'use client';

import ModernLoginSignup from '@/components/ui/modern-login-signup';

export default function SignupPage() {
  return <ModernLoginSignup redirectUrl="/home" initialIsLogin={false} />;
}
