import type { Metadata } from 'next';
import { AuthPage } from '@/components/auth/AuthPage';
import '../sign-in.css';

export const metadata: Metadata = {
  title: 'Sign in — RiskWatch',
  description: 'Secure access to the RiskWatch financial risk intelligence workspace.',
};

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams;

  return (
    <AuthPage
      mode="sign-in"
      initialError={
        error === 'callback'
          ? 'The sign-in link could not be verified or has expired. Request a new link and try again.'
          : undefined
      }
    />
  );
}
