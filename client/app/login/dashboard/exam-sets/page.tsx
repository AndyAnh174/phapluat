'use client';

import { useEffect, useState } from 'react';
import { examSetsAPI, ExamSet } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import Link from 'next/link';

export default function ExamSetsPage() {
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExamSet, setEditingExamSet] = useState<ExamSet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
  });

  useEffect(() => {
    fetchExamSets();
  }, [page]);

  const fetchExamSets = async () => {
    try {
      setLoading(true);
      const response = await examSetsAPI.getAll(page, 10);
      setExamSets(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      toast.error('Không thể tải danh sách bộ đề');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingExamSet(null);
    setFormData({ name: '', description: '', durationMinutes: 60 });
    setDialogOpen(true);
  };

  const handleEdit = (examSet: ExamSet) => {
    setEditingExamSet(examSet);
    setFormData({
      name: examSet.name,
      description: examSet.description,
      durationMinutes: examSet.durationMinutes,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingExamSet) {
        await examSetsAPI.update(editingExamSet._id, formData);
        toast.success('Cập nhật bộ đề thành công');
      } else {
        await examSetsAPI.create(formData);
        toast.success('Tạo bộ đề thành công');
      }
      setDialogOpen(false);
      fetchExamSets();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bộ đề này?')) return;

    try {
      await examSetsAPI.delete(id);
      toast.success('Xóa bộ đề thành công');
      fetchExamSets();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await examSetsAPI.duplicate(id);
      toast.success('Sao chép bộ đề thành công');
      fetchExamSets();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Bộ Đề Thi</h1>
          <p className="text-muted-foreground">Tạo và quản lý các bộ đề thi trắc nghiệm</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo Bộ Đề Mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExamSet ? 'Chỉnh Sửa Bộ Đề' : 'Tạo Bộ Đề Mới'}</DialogTitle>
              <DialogDescription>
                {editingExamSet ? 'Cập nhật thông tin bộ đề' : 'Nhập thông tin cho bộ đề mới'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên bộ đề</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên bộ đề"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Thời gian làm bài (phút)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 60 })}
                  min={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Bộ Đề</CardTitle>
          <CardDescription>Tổng số: {examSets.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : examSets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Chưa có bộ đề nào</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên bộ đề</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSets.map((examSet) => (
                    <TableRow key={examSet._id}>
                      <TableCell className="font-medium">{examSet.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{examSet.description}</TableCell>
                      <TableCell>{examSet.durationMinutes} phút</TableCell>
                      <TableCell>
                        {format(new Date(examSet.createdAt), 'dd/MM/yyyy', { locale: vi })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/login/dashboard/exam-sets/${examSet._id}/questions`}>
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicate(examSet._id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(examSet)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(examSet._id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
}

