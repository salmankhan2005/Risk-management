import type { Metadata } from 'next';
import { AuthPage } from '@/components/auth/AuthPage';
import '../../sign-in/sign-in.css';

export const metadata: Metadata = {
  title: 'Create account — RiskWatch',
  description: 'Create a RiskWatch account and save your financial risk intelligence workspace.',
};

export default function SignUpPage() {
  return <AuthPage mode="sign-up" />;
}
