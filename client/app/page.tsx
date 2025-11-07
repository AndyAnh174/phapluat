'use client';

import { BooksSection } from '@/components/books/BooksSection';
import { ExamStartSection } from '@/components/exam/ExamStartSection';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authUtils } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

function OAuthCallbackHandler() {
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
    }
  }, [searchParams, router, setUserType, setStudentProfile]);

  return null;
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <OAuthCallbackHandler />
      </Suspense>

      {/* Hero Section - Law Day Information */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="h-1 w-24 bg-[#C8102E] mx-auto mb-3"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4 tracking-tight">
              Ngày Pháp Luật Việt Nam
            </h1>
            <div className="h-1 w-24 bg-[#C8102E] mx-auto mb-4"></div>
            <p className="text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
              Ngày 09/11 hàng năm được chọn là Ngày Pháp luật nước Cộng hòa xã hội chủ nghĩa Việt Nam
            </p>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-[#C8102E] px-6 py-4">
              <h2 className="text-white text-lg font-semibold">Thông tin về Ngày Pháp luật</h2>
            </div>
            
            {/* Card Body */}
            <div className="p-8 md:p-10">
              <div className="space-y-6 text-gray-800 leading-relaxed">
                <div className="border-l-4 border-[#C8102E] pl-6">
                  <p className="text-base md:text-lg">
                    Ngày Pháp luật Việt Nam được tổ chức nhằm tôn vinh Hiến pháp và pháp luật, giáo dục ý thức thượng tôn pháp luật cho mọi người trong xã hội.
                  </p>
                </div>

                <div className="border-l-4 border-[#C8102E] pl-6">
                  <p className="text-base md:text-lg">
                    Đây là dịp để nâng cao nhận thức của toàn dân về vai trò của pháp luật trong đời sống xã hội, góp phần xây dựng nhà nước pháp quyền xã hội chủ nghĩa Việt Nam.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-md border border-gray-200 mt-6">
                  <p className="text-base md:text-lg text-gray-800">
                    <span className="font-semibold text-[#C8102E]">Trường Đại học Sư phạm Kỹ thuật TP.HCM (HCMUTE)</span> tổ chức các hoạt động tuyên truyền, phổ biến pháp luật và tổ chức thi trắc nghiệm kiến thức pháp luật cho sinh viên.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <BooksSection />

      {/* Exam Start Section */}
      <ExamStartSection />

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-gray-50">
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-600 mb-2">
            © 2024 HCMUTE - Hệ thống Trắc nghiệm và Sách Di sản
          </p>
          <p className="text-sm text-gray-600">
            Phát triển bởi{' '}
            <a
              href="https://hcmutertic.com/"
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
