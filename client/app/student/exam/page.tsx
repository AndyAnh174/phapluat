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
import thumbnail from '@/assets/THUMBNAIL@4x.png';
import { Clock, FileText, CheckCircle2, Loader2 } from 'lucide-react';

export default function ExamPage() {
  const router = useRouter();
  const { userType, isAuthenticated } = useAuth();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Handle scroll to shrink header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C8102E] mx-auto mb-4" />
          <p className="text-lg text-gray-700 font-medium">Đang tải bài thi...</p>
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

  // Calculate progress and time warning
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = session.questions.length;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isTimeWarning = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className="min-h-screen bg-gray-50">
      <img src={thumbnail.src} alt="Thumbnail" className="block mx-auto w-full object-cover" />
      <div className="pt-0 pb-16 px-4 container mx-auto max-w-4xl">
        {/* Header with timer */}
        <Card className={`mb-6 sticky top-0 z-10 shadow-md border border-gray-200 overflow-hidden transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''} bg-[#C8102E]`}>
          <CardHeader className={`bg-[#C8102E] text-white transition-all duration-300 ${isScrolled ? 'p-3' : 'p-6'}`}>
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${isScrolled ? 'gap-2' : 'gap-4'}`}>
              <div className="flex-1 w-full">
                {!isScrolled ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-white" />
                      <CardTitle className="text-white text-xl font-semibold">Bài Thi Trắc Nghiệm</CardTitle>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-5 w-5 ${isTimeWarning ? 'animate-pulse' : ''}`} />
                        <CardDescription className="text-white/90">
                          Thời gian: <span className={`font-bold text-2xl text-white ${isTimeWarning ? 'text-yellow-300 animate-pulse' : ''}`}>{formatTime(timeRemaining)}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <CardDescription className="text-white/90">
                          Đã trả lời: <span className="font-bold text-xl text-white">{answeredCount}/{totalQuestions}</span>
                        </CardDescription>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-4 w-4 text-white flex-shrink-0" />
                      <CardTitle className="text-white text-base font-semibold">Bài Thi Trắc Nghiệm</CardTitle>
                      <div className="hidden sm:flex items-center gap-4 ml-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-4 w-4 ${isTimeWarning ? 'animate-pulse' : ''}`} />
                          <span className={`text-sm font-bold text-white ${isTimeWarning ? 'text-yellow-300 animate-pulse' : ''}`}>{formatTime(timeRemaining)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-bold text-white">{answeredCount}/{totalQuestions}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitted}
                      size={isScrolled ? 'sm' : 'default'}
                      className="bg-white text-[#C8102E] hover:bg-gray-100 font-semibold whitespace-nowrap"
                    >
                      {submitted ? 'Đang nộp...' : 'Nộp Bài'}
                    </Button>
                  </div>
                )}
              </div>
              {!isScrolled && (
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitted}
                  className="bg-white text-[#C8102E] hover:bg-gray-100 font-semibold whitespace-nowrap"
                >
                  {submitted ? 'Đang nộp bài...' : 'Nộp Bài'}
                </Button>
              )}
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
            <Card key={question._id} className="shadow-md border border-gray-200 overflow-hidden">
              <CardHeader className="bg-white p-6 border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Câu {index + 1}: {question.content}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Object.entries(question.options)
                    .filter(([key]) => ['A', 'B', 'C', 'D'].includes(key))
                    .map(([key, value]) => (
                      <label
                        key={key}
                        className={`flex items-center space-x-3 p-4 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 ${
                          answers[question._id] === key
                            ? 'bg-[#FFF1F2] border-[#C8102E] border-2 shadow-sm scale-[1.02]'
                            : 'bg-white hover:bg-gray-50 hover:border-gray-300'
                        } ${submitted ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name={question._id}
                          value={key}
                          checked={answers[question._id] === key}
                          onChange={() => handleAnswerChange(question._id, key)}
                          className="w-5 h-5 text-[#C8102E] focus:ring-[#C8102E]"
                          disabled={submitted}
                        />
                        <span className="flex-1 text-gray-800">
                          <strong className="text-[#C8102E]">{key}.</strong> {value}
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
          <Button 
            size="lg" 
            onClick={handleSubmit} 
            disabled={submitted}
            className="bg-[#C8102E] hover:bg-[#A00D26] text-white font-semibold px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            {submitted ? 'Đang nộp bài...' : 'Nộp Bài'}
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

