'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { examAPI, ExamSession, SubmitExamRequest } from '@/lib/api';
import { authUtils } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vi } from 'date-fns/locale/vi';

export default function ExamPage() {
  const router = useRouter();
  const { userType, isAuthenticated } = useAuth();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || userType !== 'student') {
      router.push('/');
      return;
    }

    const startExam = async () => {
      try {
        setLoading(true);
        const examSession = await examAPI.start();
        setSession(examSession);
        // Get durationMinutes from response (should be directly in examSession now)
        const durationMinutes = examSession.durationMinutes || 60;
        setTimeRemaining(durationMinutes * 60);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Không thể bắt đầu bài thi');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    startExam();
  }, [isAuthenticated, userType, router]);

  const handleSubmit = async () => {
    if (!session || submitted) return;

    try {
      setSubmitted(true);
      const submitData: SubmitExamRequest = {
        sessionId: session.sessionId,
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })),
      };

      await examAPI.submit(submitData);
      router.push(`/student/exam/result/${session.sessionId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể nộp bài');
      setSubmitted(false);
    }
  };

  useEffect(() => {
    if (!session || submitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, submitted, handleSubmit]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    // Check if error is about already submitted exam
    const isAlreadySubmitted = error.includes('đã nộp bài') || error.includes('already submitted');
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="bg-[#C8102E] text-white rounded-t-lg">
            <CardTitle className="text-white text-xl">
              {isAlreadySubmitted ? 'Thông Báo' : 'Lỗi'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Alert variant={isAlreadySubmitted ? "default" : "destructive"} className="mb-4">
              <AlertDescription className="text-base">
                {error}
              </AlertDescription>
            </Alert>
            
            {isAlreadySubmitted && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Lưu ý:</strong> Bạn có thể xem kết quả bài thi đã nộp bằng cách:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Truy cập trang kết quả từ menu</li>
                  <li>Hoặc liên hệ với admin để được hỗ trợ</li>
                </ul>
              </div>
            )}
            
            <Button 
              className="w-full bg-[#C8102E] hover:bg-[#A00D26] text-white"
              onClick={() => router.push('/')}
            >
              Về Trang Chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header with timer */}
        <Card className="mb-6 sticky top-4 z-10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Bài Thi Trắc Nghiệm</CardTitle>
                <CardDescription>
                  Thời gian còn lại: <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
                </CardDescription>
              </div>
              <Button onClick={handleSubmit} disabled={submitted}>
                {submitted ? 'Đang nộp bài...' : 'Nộp Bài'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {session.questions.map((question, index) => (
            <Card key={question._id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Câu {index + 1}: {question.content}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(question.options)
                    .filter(([key]) => ['A', 'B', 'C', 'D'].includes(key))
                    .map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                      >
                        <input
                          type="radio"
                          name={question._id}
                          value={key}
                          checked={answers[question._id] === key}
                          onChange={() => handleAnswerChange(question._id, key)}
                          className="w-4 h-4"
                          disabled={submitted}
                        />
                        <span className="flex-1">
                          <strong>{key}.</strong> {value}
                        </span>
                      </label>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit button at bottom */}
        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={handleSubmit} disabled={submitted}>
            {submitted ? 'Đang nộp bài...' : 'Nộp Bài'}
          </Button>
        </div>
      </div>
    </div>
  );
}

