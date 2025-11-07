'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authUtils } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUserType, setStudentProfile } = useAuth();

  useEffect(() => {
    // Handle OAuth callback
    const token = searchParams.get('token');
    if (token) {
      // Store token and set user type
      authUtils.setToken(token, 'student');
      setUserType('student');
      
      // Fetch student profile
      import('@/lib/api').then(({ authAPI }) => {
        authAPI
          .getStudentProfile()
          .then((profile) => {
            setStudentProfile(profile);
            // Redirect to exam page
            router.push('/student/exam');
          })
          .catch((err) => {
            console.error('Failed to fetch profile:', err);
            router.push('/');
          });
      });
    } else {
      // No token, redirect to home
      router.push('/');
    }
  }, [searchParams, router, setUserType, setStudentProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

