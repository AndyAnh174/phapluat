'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { questionsAPI, Question, examSetsAPI, ExamSet } from '@/lib/api';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const examSetId = params.id as string;
  const [examSet, setExamSet] = useState<ExamSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    order: 1,
  });

  useEffect(() => {
    fetchData();
  }, [examSetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examSetData, questionsData] = await Promise.all([
        examSetsAPI.getById(examSetId),
        questionsAPI.getAll(examSetId),
      ]);
      setExamSet(examSetData);
      setQuestions(questionsData.sort((a, b) => a.order - b.order));
    } catch (err) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setFormData({
      content: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      order: questions.length + 1,
    });
    setDialogOpen(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      content: question.content,
      options: question.options,
      correctAnswer: question.correctAnswer,
      order: question.order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingQuestion) {
        await questionsAPI.update(editingQuestion._id, formData);
        toast.success('Cập nhật câu hỏi thành công');
      } else {
        await questionsAPI.create(examSetId, formData);
        toast.success('Tạo câu hỏi thành công');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;

    try {
      await questionsAPI.delete(id);
      toast.success('Xóa câu hỏi thành công');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/login/dashboard/exam-sets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Câu Hỏi</h1>
          <p className="text-muted-foreground">{examSet?.name}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm Câu Hỏi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Cập nhật thông tin câu hỏi' : 'Nhập thông tin cho câu hỏi mới'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="order">Thứ tự</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Nội dung câu hỏi</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optionA">Đáp án A</Label>
                  <Input
                    id="optionA"
                    value={formData.options.A}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        options: { ...formData.options, A: e.target.value },
                      })
                    }
                    placeholder="Nhập đáp án A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionB">Đáp án B</Label>
                  <Input
                    id="optionB"
                    value={formData.options.B}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        options: { ...formData.options, B: e.target.value },
                      })
                    }
                    placeholder="Nhập đáp án B"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionC">Đáp án C</Label>
                  <Input
                    id="optionC"
                    value={formData.options.C}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        options: { ...formData.options, C: e.target.value },
                      })
                    }
                    placeholder="Nhập đáp án C"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionD">Đáp án D</Label>
                  <Input
                    id="optionD"
                    value={formData.options.D}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        options: { ...formData.options, D: e.target.value },
                      })
                    }
                    placeholder="Nhập đáp án D"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Đáp án đúng</Label>
                <Select
                  value={formData.correctAnswer}
                  onValueChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
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
          <CardTitle>Danh Sách Câu Hỏi</CardTitle>
          <CardDescription>Tổng số: {questions.length} câu</CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Chưa có câu hỏi nào</div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Câu {question.order}: {question.content}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(question._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(question.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`p-2 rounded ${
                            key === question.correctAnswer
                              ? 'bg-green-100 dark:bg-green-900/20 border border-green-500'
                              : 'bg-muted'
                          }`}
                        >
                          <strong>{key}.</strong> {value}
                          {key === question.correctAnswer && (
                            <span className="ml-2 text-green-600 dark:text-green-400">✓ Đúng</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

