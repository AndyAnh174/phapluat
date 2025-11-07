'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authUtils } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import thumbnail from '@/assets/THUMBNAIL@4x.png';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUserType, setStudentProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for error in query params (server might redirect with error)
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setLoading(false);
      return;
    }

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
            // Check if error is about email domain
            const errorMessage = err.response?.data?.message || err.message || '';
            const isEmailError = 
              errorMessage.includes('email') || 
              errorMessage.includes('HCMUTE') || 
              errorMessage.includes('domain') ||
              errorMessage.includes('tài khoản') ||
              err.response?.status === 403;
            
            if (isEmailError) {
              setError('Tài khoản email của bạn không thuộc hệ thống HCMUTE. Vui lòng sử dụng tài khoản Google có đuôi @hcmute.edu.vn để đăng nhập.');
            } else {
              setError('Không thể xác thực tài khoản. Vui lòng thử lại.');
            }
            setLoading(false);
            // Clear invalid token
            authUtils.clearToken();
            setUserType(null);
          });
      });
    } else {
      // No token, check if there's an error message
      const errorMsg = searchParams.get('message');
      if (errorMsg) {
        setError(decodeURIComponent(errorMsg));
      } else {
        setError('Không nhận được thông tin xác thực. Vui lòng thử lại.');
      }
      setLoading(false);
    }
  }, [searchParams, router, setUserType, setStudentProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8102E] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xử lý đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <img src={thumbnail.src} alt="Thumbnail" className="block mx-auto w-full object-cover" />
        <div className="pt-0 pb-16 px-4 container mx-auto max-w-2xl">
          <Card className="mt-8 shadow-md border border-gray-200 overflow-hidden">
            <CardHeader className="bg-[#C8102E] text-white p-6">
              <CardTitle className="text-white text-xl font-semibold">Lỗi Đăng Nhập</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Alert variant="destructive" className="mb-6">
                <AlertDescription className="text-base">
                  {error}
                </AlertDescription>
              </Alert>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Lưu ý:</strong> Hệ thống chỉ chấp nhận tài khoản Google có đuôi email:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>@hcmute.edu.vn (Giảng viên, Cán bộ HCMUTE)</li>
                  <li>@student.hcmute.edu.vn (Sinh viên HCMUTE)</li>
                </ul>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  className="flex-1 bg-[#C8102E] hover:bg-[#A00D26] text-white"
                  onClick={() => router.push('/')}
                >
                  Về Trang Chủ
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 border-[#C8102E] text-[#C8102E] hover:bg-[#FFF1F2]"
                  onClick={() => {
                    authUtils.clearToken();
                    window.location.href = '/';
                  }}
                >
                  Thử Lại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="py-8 px-4 border-t bg-gray-50">
          <div className="container mx-auto text-center">
            <p className="text-sm text-gray-600 mb-2">
              © {new Date().getFullYear()} HCMUTE - Hệ thống Trắc nghiệm và Sách Di sản Pháp Luật
            </p>
            <p className="text-sm text-gray-600">
              Phát triển bởi{' '}
              <a
                href="https://www.facebook.com/hcmute.rtic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C8102E] hover:text-[#A00D26] font-semibold transition-colors"
              >
                HCM UTE Research on Technology and Innovation Club
              </a>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return null;
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

