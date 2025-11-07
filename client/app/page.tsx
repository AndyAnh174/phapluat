'use client';

import { BooksSection } from '@/components/books/BooksSection';
import { ExamStartSection } from '@/components/exam/ExamStartSection';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authUtils } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import thumbnail from '@/assets/THUMBNAIL@4x.png';
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
      {/* Banner image: remove top margin so it sits flush, make full-width within container */}
      <img src={thumbnail.src} alt="Thumbnail" className="block mx-auto w-full object-cover" />
      <section className="pt-0 pb-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            {/* <div className="inline-block mb-4">
              <div className="h-1 w-24 bg-[#C8102E] mx-auto mb-3"></div>
            </div> */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-3 tracking-tight">
              Ngày Pháp luật Việt Nam
            </h1>
            <div className="h-1 w-24 bg-[#C8102E] mx-auto mb-4"></div>

            {/* Styled date badge */}
            <div className="mb-4">
              <time
                dateTime="2025-11-09"
                className="inline-block text-sm text-[#C8102E] bg-[#FFF1F2] px-3 py-1 rounded-full font-semibold"
              >
                9 tháng 11
              </time>
            </div>

            <p className="text-base md:text-lg text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
              Ngày 9 tháng 11 hằng năm được chọn là Ngày Pháp luật của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
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
