'use client';

import { useEffect, useState } from 'react';
import { examAPI, ExamStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { redirectToGoogleAuth } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Clock, FileText, Calendar, LogIn } from 'lucide-react';

export function ExamStartSection() {
  const [examStatus, setExamStatus] = useState<ExamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { userType, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchExamStatus = async () => {
      try {
        setLoading(true);
        const status = await examAPI.getStatus();
        setExamStatus(status);
      } catch (err: unknown) {
        // Silently handle 401 errors (not logged in) - this is expected on homepage
        // Only log other errors
        const error = err as { response?: { status?: number } };
        if (error.response?.status !== 401) {
          console.error('Failed to fetch exam status:', err);
        }
        // Set status to inactive so UI shows "no exam available" message
        setExamStatus({ isActive: false });
      } finally {
        setLoading(false);
      }
    };

    fetchExamStatus();
  }, []);

  const handleStartExam = () => {
    if (!isAuthenticated || userType !== 'student') {
      // Redirect to Google OAuth
      redirectToGoogleAuth();
    } else {
      // Already logged in, go to exam page
      router.push('/student/exam');
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-[#C8102E] px-6 py-4">
              <h2 className="text-white text-lg font-semibold">Bài Thi Trắc Nghiệm</h2>
            </div>
            <div className="p-8 text-center">
              <p className="text-gray-600">Đang kiểm tra trạng thái bài thi...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!examStatus?.isActive || !examStatus.exam) {
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-[#C8102E] px-6 py-4">
              <h2 className="text-white text-lg font-semibold">Bài Thi Trắc Nghiệm</h2>
            </div>
            <div className="p-8">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-gray-800">
                  Hiện chưa có bài thi nào đang mở. Vui lòng đợi admin mở bài thi để bắt đầu làm bài.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { exam } = examStatus;

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#C8102E] px-6 py-5">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-white" />
              <h2 className="text-white text-xl font-semibold">Bài Thi Trắc Nghiệm</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">
            {/* Exam Name */}
            <div className="mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {exam.name}
              </h3>
              <div className="h-1 w-20 bg-[#C8102E] mt-3"></div>
            </div>

            {/* Exam Info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Clock className="h-5 w-5 text-[#C8102E] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Thời gian làm bài</p>
                  <p className="text-lg font-medium text-gray-900">{exam.durationMinutes} phút</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="h-5 w-5 text-[#C8102E] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Bắt đầu từ</p>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date(exam.activatedAt).toLocaleString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full bg-[#C8102E] hover:bg-[#A00D26] text-white font-semibold py-6 text-lg shadow-md hover:shadow-lg transition-all duration-200"
                onClick={handleStartExam}
              >
                {isAuthenticated && userType === 'student' ? (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Bắt Đầu Làm Bài
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Đăng Nhập Để Làm Bài
                  </>
                )}
              </Button>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <span className="font-semibold text-[#C8102E]">Lưu ý:</span> {!isAuthenticated ? 'Bạn cần đăng nhập bằng tài khoản Google HCMUTE để làm bài thi' : 'Hệ thống chỉ chấp nhận tài khoản Google HCMUTE'}
                </p>
                <p className="text-xs text-blue-700 mb-1">Hệ thống chỉ chấp nhận tài khoản có đuôi email:</p>
                <ul className="text-xs text-blue-700 list-disc list-inside space-y-0.5 ml-2">
                  <li>@hcmute.edu.vn (Giảng viên, Cán bộ HCMUTE)</li>
                  <li>@student.hcmute.edu.vn (Sinh viên HCMUTE)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

