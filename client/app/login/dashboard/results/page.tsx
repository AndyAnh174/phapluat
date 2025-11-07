'use client';

import { useEffect, useState } from 'react';
import { resultsAPI, examSetsAPI, ExamSet, ExamResult } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [selectedExamSetId, setSelectedExamSetId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingResult, setViewingResult] = useState<ExamResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchExamSets();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [selectedExamSetId, page]);

  const fetchExamSets = async () => {
    try {
      const response = await examSetsAPI.getAll(1, 100);
      setExamSets(response.data);
    } catch (err) {
      console.error('Failed to fetch exam sets:', err);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const examSetId = selectedExamSetId === 'all' ? undefined : selectedExamSetId;
      const response = await resultsAPI.getAll(examSetId, page, 10);
      setResults(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      toast.error('Không thể tải kết quả');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (sessionId: string) => {
    try {
      const result = await resultsAPI.getById(sessionId);
      setViewingResult(result);
      setDialogOpen(true);
    } catch (err) {
      toast.error('Không thể tải chi tiết');
    }
  };

  const handleReset = async (sessionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn reset bài thi này? Sinh viên sẽ có thể làm lại.')) return;

    try {
      await resultsAPI.reset(sessionId);
      toast.success('Reset bài thi thành công');
      fetchResults();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleExportJSON = async () => {
    try {
      const examSetId = selectedExamSetId === 'all' ? undefined : selectedExamSetId;
      const data = await resultsAPI.exportJSON(examSetId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất JSON thành công');
    } catch (err) {
      toast.error('Không thể xuất JSON');
    }
  };

  const handleExportCSV = async () => {
    try {
      const examSetId = selectedExamSetId === 'all' ? undefined : selectedExamSetId;
      const blob = await resultsAPI.exportCSV(examSetId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất CSV thành công');
    } catch (err) {
      toast.error('Không thể xuất CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Kết Quả</h1>
          <p className="text-muted-foreground">Xem và quản lý kết quả thi của sinh viên</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="mr-2 h-4 w-4" />
            Xuất JSON
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lọc Kết Quả</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedExamSetId} onValueChange={setSelectedExamSetId}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Tất cả bộ đề" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả bộ đề</SelectItem>
              {examSets.map((examSet) => (
                <SelectItem key={examSet._id} value={examSet._id}>
                  {examSet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Kết Quả</CardTitle>
          <CardDescription>Tổng số: {results.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Chưa có kết quả nào</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sinh viên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Bộ đề</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.sessionId}>
                      <TableCell className="font-medium">
                        {result.user?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{result.user?.email || 'N/A'}</TableCell>
                      <TableCell>{result.examSet?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={result.percentage >= 50 ? 'default' : 'destructive'}>
                          {result.score}/{result.totalQuestions} ({result.percentage}%)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(result.submittedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(result.sessionId)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReset(result.sessionId)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Trước
                  </Button>
                  <span className="flex items-center px-4">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi Tiết Kết Quả</DialogTitle>
            <DialogDescription>Xem chi tiết câu trả lời của sinh viên</DialogDescription>
          </DialogHeader>
          {viewingResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Sinh viên:</p>
                  <p className="text-sm">{viewingResult.examSet?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Điểm:</p>
                  <p className="text-sm">
                    {viewingResult.score}/{viewingResult.totalQuestions} ({viewingResult.percentage}%)
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {viewingResult.answers.map((answer, index) => (
                  <Card key={answer.questionId}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Câu {index + 1}: {answer.question.content}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(answer.question.options).map(([key, value]) => (
                          <div
                            key={key}
                            className={`p-2 rounded ${
                              key === answer.question.correctAnswer
                                ? 'bg-green-100 dark:bg-green-900/20 border border-green-500'
                                : key === answer.selectedAnswer && !answer.isCorrect
                                ? 'bg-red-100 dark:bg-red-900/20 border border-red-500'
                                : 'bg-muted'
                            }`}
                          >
                            <strong>{key}.</strong> {value}
                            {key === answer.question.correctAnswer && (
                              <span className="ml-2 text-green-600 dark:text-green-400">✓ Đúng</span>
                            )}
                            {key === answer.selectedAnswer && (
                              <span className="ml-2">(Đã chọn)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

