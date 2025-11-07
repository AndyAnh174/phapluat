'use client';

import { useEffect, useState } from 'react';
import { examAPI, examSetsAPI, ExamStatus, ExamSet } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function ExamActivationPage() {
  const [examStatus, setExamStatus] = useState<ExamStatus | null>(null);
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [selectedExamSetId, setSelectedExamSetId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [status, examSetsData] = await Promise.all([
        examAPI.getAdminStatus(),
        examSetsAPI.getAll(1, 100),
      ]);
      setExamStatus(status);
      setExamSets(examSetsData.data);
    } catch (err) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedExamSetId) {
      toast.error('Vui lòng chọn bộ đề');
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        toast.error('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
    }

    try {
      // Convert datetime-local format to ISO string
      const startDateISO = startDate ? new Date(startDate).toISOString() : undefined;
      const endDateISO = endDate ? new Date(endDate).toISOString() : undefined;

      await examAPI.activate(
        selectedExamSetId,
        startDateISO,
        endDateISO
      );
      toast.success('Kích hoạt bài thi thành công');
      setStartDate('');
      setEndDate('');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Bạn có chắc chắn muốn đóng bài thi?')) return;

    try {
      console.log('Deactivating exam...');
      await examAPI.deactivate();
      console.log('Exam deactivated successfully');
      toast.success('Đóng bài thi thành công');
      // Wait a bit before fetching to ensure DB is updated
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      console.error('Error deactivating exam:', err);
      toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kích Hoạt Bài Thi</h1>
        <p className="text-muted-foreground">Quản lý trạng thái bài thi hiện tại</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trạng Thái Hiện Tại</CardTitle>
            <CardDescription>Thông tin bài thi đang hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            {examStatus?.activeExam ? (() => {
              // Check if exam is scheduled for future (has startDate in future)
              const isScheduled = examStatus.activeExam.startDate && 
                new Date(examStatus.activeExam.startDate) > new Date();
              
              // Only show if active or scheduled for future
              if (!examStatus.isActive && !isScheduled) {
                return (
                  <Alert>
                    <AlertDescription>Hiện chưa có bài thi nào đang mở</AlertDescription>
                  </Alert>
                );
              }

              return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trạng thái:</span>
                  <Badge variant={examStatus.isActive ? "default" : "secondary"}>
                    {examStatus.isActive ? 'Đang mở' : 'Đã lên lịch'}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">{examStatus.activeExam.examSet.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {examStatus.activeExam.examSet.description}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Thời gian:</strong> {examStatus.activeExam.examSet.durationMinutes} phút
                  </p>
                  {examStatus.activeExam.startDate ? (
                    <p>
                      <strong>Bắt đầu:</strong>{' '}
                      {format(new Date(examStatus.activeExam.startDate), 'PPpp', { locale: vi })}
                    </p>
                  ) : (
                    <p>
                      <strong>Kích hoạt lúc:</strong>{' '}
                      {format(new Date(examStatus.activeExam.activatedAt), 'PPpp', { locale: vi })}
                    </p>
                  )}
                  {examStatus.activeExam.endDate && (
                    <p>
                      <strong>Kết thúc:</strong>{' '}
                      {format(new Date(examStatus.activeExam.endDate), 'PPpp', { locale: vi })}
                    </p>
                  )}
                  {examStatus.activeExam.startDate && new Date(examStatus.activeExam.startDate) > new Date() && (
                    <Alert className="mt-2">
                      <AlertDescription className="text-xs">
                        Bài thi sẽ tự động mở vào thời điểm bắt đầu đã lên lịch
                      </AlertDescription>
                    </Alert>
                  )}
                  {examStatus.activeExam.endDate && new Date(examStatus.activeExam.endDate) < new Date() && (
                    <Alert className="mt-2">
                      <AlertDescription className="text-xs">
                        Bài thi đã hết thời gian và tự động đóng
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <Button variant="destructive" onClick={handleDeactivate} className="w-full">
                  Đóng Bài Thi
                </Button>
              </div>
              );
            })() : (
              <Alert>
                <AlertDescription>Hiện chưa có bài thi nào đang mở</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kích Hoạt Bài Thi Mới</CardTitle>
            <CardDescription>Chọn bộ đề và thời gian để kích hoạt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exam-set">Chọn bộ đề</Label>
              <Select value={selectedExamSetId} onValueChange={setSelectedExamSetId}>
                <SelectTrigger id="exam-set">
                  <SelectValue placeholder="Chọn bộ đề thi" />
                </SelectTrigger>
                <SelectContent>
                  {examSets.map((examSet) => (
                    <SelectItem key={examSet._id} value={examSet._id}>
                      {examSet.name} ({examSet.durationMinutes} phút)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Ngày bắt đầu (tùy chọn)</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Để trống nếu muốn kích hoạt ngay
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">Ngày kết thúc (tùy chọn)</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                  min={startDate || undefined}
                />
                <p className="text-xs text-muted-foreground">
                  Để trống nếu không giới hạn thời gian
                </p>
              </div>
            </div>

            {selectedExamSetId && (
              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Thông tin bộ đề:</p>
                {(() => {
                  const selected = examSets.find((e) => e._id === selectedExamSetId);
                  return selected ? (
                    <>
                      <p>Mô tả: {selected.description}</p>
                      <p>Thời gian: {selected.durationMinutes} phút</p>
                    </>
                  ) : null;
                })()}
              </div>
            )}

            {(startDate || endDate) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-medium mb-2 text-blue-900">Thời gian thi:</p>
                {startDate && (
                  <p className="text-blue-800">
                    <strong>Bắt đầu:</strong>{' '}
                    {new Date(startDate).toLocaleString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {endDate && (
                  <p className="text-blue-800">
                    <strong>Kết thúc:</strong>{' '}
                    {new Date(endDate).toLocaleString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleActivate}
              disabled={!selectedExamSetId || !!examStatus?.activeExam}
              className="w-full"
            >
              Kích Hoạt Bài Thi
            </Button>
            {examStatus?.activeExam && (
              <Alert>
                <AlertDescription>
                  Vui lòng đóng bài thi hiện tại trước khi kích hoạt bài thi mới
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

