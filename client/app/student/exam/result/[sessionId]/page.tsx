'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examAPI, ExamResult } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import thumbnail from '@/assets/THUMBNAIL@4x.png';

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, userType } = useAuth();
  const sessionId = params.sessionId as string;
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || userType !== 'student') {
      router.push('/');
      return;
    }

    const fetchResult = async () => {
      try {
        setLoading(true);
        const examResult = await examAPI.getResult(sessionId);
        setResult(examResult);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Không thể tải kết quả');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [sessionId, isAuthenticated, userType, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-700">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full shadow-md border border-gray-200">
          <CardHeader className="bg-[#C8102E] text-white">
            <CardTitle className="text-white">Lỗi</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>{error || 'Không tìm thấy kết quả'}</AlertDescription>
            </Alert>
            <Button 
              className="mt-4 w-full bg-[#C8102E] hover:bg-[#A00D26] text-white" 
              onClick={() => router.push('/')}
            >
              Về Trang Chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate correct answers count
  const correctAnswersCount = result.answers.filter(answer => answer.isCorrect).length;
  const totalQuestions = result.answers.length;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <img src={thumbnail.src} alt="Thumbnail" className="block mx-auto w-full object-cover" />
      <div className="pt-0 pb-16 px-4 container mx-auto max-w-4xl">
        <Card className="mb-6 shadow-md border border-gray-200 overflow-hidden">
          <CardHeader className="bg-[#C8102E] text-white p-6">
            <CardTitle className="text-white text-xl font-semibold">Kết Quả Bài Thi</CardTitle>
            <CardDescription className="text-white/90 mt-2">{result.examSet?.name}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-2">Điểm số</p>
                <p className="text-3xl font-bold text-[#C8102E]">
                  {correctAnswersCount}/{totalQuestions}
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-2">Tỷ lệ</p>
                <p className="text-3xl font-bold text-gray-900">{percentage}%</p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-2">Thời gian nộp</p>
                <p className="text-sm font-medium text-gray-800">
                  {format(new Date(result.submittedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chi Tiết Câu Trả Lời</h2>
          {result.answers.map((answer, index) => (
            <Card key={answer.questionId} className="shadow-md border border-gray-200 overflow-hidden">
              <CardHeader className="bg-white p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Câu {index + 1}: {answer.question.content}
                  </CardTitle>
                  <Badge 
                    variant={answer.isCorrect ? 'default' : 'destructive'}
                    className={answer.isCorrect ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {answer.isCorrect ? 'Đúng' : 'Sai'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Object.entries(answer.question.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border ${
                        key === answer.question.correctAnswer
                          ? 'bg-green-50 border-green-300 border-2'
                          : key === answer.selectedAnswer && !answer.isCorrect
                          ? 'bg-red-50 border-red-300 border-2'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800">
                          <strong className="text-[#C8102E]">{key}.</strong> {value}
                        </span>
                        {key === answer.question.correctAnswer && (
                          <span className="text-green-700 font-medium text-sm">
                            ✓ Đáp án đúng
                          </span>
                        )}
                        {key === answer.selectedAnswer && key !== answer.question.correctAnswer && (
                          <span className="text-red-700 font-medium text-sm">
                            (Bạn đã chọn)
                          </span>
                        )}
                        {key === answer.selectedAnswer && key === answer.question.correctAnswer && (
                          <span className="text-green-700 font-medium text-sm">
                            (Bạn đã chọn)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => router.push('/')}
            className="bg-[#C8102E] hover:bg-[#A00D26] text-white font-semibold px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Về Trang Chủ
          </Button>
        </div>
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

