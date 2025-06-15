'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { HeartPulse, UserPlus } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

const signupSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupFormInputs = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/chat');
    }
  }, [user, authLoading, router]);

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.displayName) {
        await updateProfile(userCredential.user, { displayName: data.displayName });
      }
      // Consider adding user profile to Firestore here if needed
      toast({
        title: t('signupSuccessTitle') || 'Account Created',
        description: t('signupSuccessDesc') || "Welcome! You're now logged in.",
      });
      router.push('/chat'); // Redirect after successful signup
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: t('signupErrorTitle') || 'Signup Failed',
        description: error.message || t('signupErrorDesc') || 'Could not create account. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10 p-3 w-16 h-16">
            <HeartPulse className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-headline">{t('signupTitle')}</CardTitle>
        <CardDescription>{t('signupDescription') || 'Create an account to get started.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayNameLabel') || 'Display Name (Optional)'}</Label>
            <Input
              id="displayName"
              type="text"
              placeholder={t('displayNamePlaceholder') || "Your Name"}
              {...register('displayName')}
            />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner className="mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {t('signupButton')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {t('alreadyHaveAccount')}{' '}
          <Button variant="link" asChild className="p-0 h-auto">
             <Link href="/login" className="font-medium text-primary hover:underline">
                {t('loginButton')}
             </Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
