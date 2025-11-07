'use client';

import { useEffect, useState } from 'react';
import { examAPI, ExamStatus } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function DashboardPage() {
  const [examStatus, setExamStatus] = useState<ExamStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await examAPI.getAdminStatus();
        setExamStatus(status);
      } catch (err) {
        console.error('Failed to fetch exam status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tổng Quan</h1>
        <p className="text-muted-foreground">Quản lý hệ thống trắc nghiệm HCMUTE</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trạng Thái Bài Thi</CardTitle>
            <CardDescription>Thông tin bài thi hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            {examStatus?.isActive && examStatus.activeExam ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trạng thái:</span>
                  <Badge variant="default">Đang mở</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">{examStatus.activeExam.examSet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Thời gian: {examStatus.activeExam.examSet.durationMinutes} phút
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Kích hoạt lúc:{' '}
                    {format(new Date(examStatus.activeExam.activatedAt), 'PPpp', { locale: vi })}
                  </p>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>Hiện chưa có bài thi nào đang mở</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hướng Dẫn</CardTitle>
            <CardDescription>Các bước quản lý hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Tạo bộ đề thi mới trong mục &quot;Bộ Đề Thi&quot;</li>
              <li>Thêm câu hỏi cho từng bộ đề</li>
              <li>Kích hoạt bài thi trong mục &quot;Kích Hoạt Thi&quot;</li>
              <li>Xem kết quả và xuất dữ liệu trong mục &quot;Kết Quả&quot;</li>
              <li>Quản lý sách di sản trong mục &quot;Sách Di Sản&quot;</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

