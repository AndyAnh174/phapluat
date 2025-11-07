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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Lỗi</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Không tìm thấy kết quả'}</AlertDescription>
            </Alert>
            <Button className="mt-4 w-full" onClick={() => router.push('/')}>
              Về Trang Chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Kết Quả Bài Thi</CardTitle>
            <CardDescription>{result.examSet?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Điểm số</p>
                <p className="text-2xl font-bold">
                  {result.score}/{result.totalQuestions}
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Tỷ lệ</p>
                <p className="text-2xl font-bold">{result.percentage}%</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Thời gian nộp</p>
                <p className="text-sm font-medium">
                  {format(new Date(result.submittedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Chi Tiết Câu Trả Lời</h2>
          {result.answers.map((answer, index) => (
            <Card key={answer.questionId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Câu {index + 1}: {answer.question.content}
                  </CardTitle>
                  <Badge variant={answer.isCorrect ? 'default' : 'destructive'}>
                    {answer.isCorrect ? 'Đúng' : 'Sai'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(answer.question.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg ${
                        key === answer.question.correctAnswer
                          ? 'bg-green-100 dark:bg-green-900/20 border-2 border-green-500'
                          : key === answer.selectedAnswer && !answer.isCorrect
                          ? 'bg-red-100 dark:bg-red-900/20 border-2 border-red-500'
                          : 'bg-muted border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          <strong>{key}.</strong> {value}
                        </span>
                        {key === answer.question.correctAnswer && (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✓ Đáp án đúng
                          </span>
                        )}
                        {key === answer.selectedAnswer && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
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

        <div className="mt-8 text-center">
          <Button onClick={() => router.push('/')}>Về Trang Chủ</Button>
        </div>
      </div>
    </div>
  );
}

