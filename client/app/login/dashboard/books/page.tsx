'use client';

import { useEffect, useState } from 'react';
import { booksAPI, Book } from '@/lib/api';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    coverImageUrl: '',
    quote: '',
    author: '',
    publishedAt: '',
    isPublic: true,
  });

  useEffect(() => {
    fetchBooks();
  }, [page]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getAllAdmin({ page, limit: 10 });
      setBooks(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      toast.error('Không thể tải danh sách sách');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      coverImageUrl: '',
      quote: '',
      author: '',
      publishedAt: new Date().toISOString().split('T')[0],
      isPublic: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      subtitle: book.subtitle || '',
      description: book.description,
      coverImageUrl: book.coverImageUrl || '',
      quote: book.quote || '',
      author: book.author,
      publishedAt: book.publishedAt ? new Date(book.publishedAt).toISOString().split('T')[0] : '',
      isPublic: book.isPublic,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        publishedAt: new Date(formData.publishedAt).toISOString(),
      };

      if (editingBook) {
        await booksAPI.update(editingBook._id, submitData);
        toast.success('Cập nhật sách thành công');
      } else {
        await booksAPI.create(submitData);
        toast.success('Tạo sách thành công');
      }
      setDialogOpen(false);
      fetchBooks();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sách này?')) return;

    try {
      await booksAPI.delete(id);
      toast.success('Xóa sách thành công');
      fetchBooks();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Sách Di Sản</h1>
          <p className="text-muted-foreground">Tạo và quản lý các cuốn sách di sản</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm Sách Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Chỉnh Sửa Sách' : 'Thêm Sách Mới'}</DialogTitle>
              <DialogDescription>
                {editingBook ? 'Cập nhật thông tin sách' : 'Nhập thông tin cho sách mới'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Tiêu đề phụ</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Nhập tiêu đề phụ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Tác giả *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Nhập tên tác giả"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả"
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote">Trích dẫn</Label>
                <Textarea
                  id="quote"
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="Nhập trích dẫn nổi bật"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">URL ảnh bìa</Label>
                <Input
                  id="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishedAt">Ngày xuất bản *</Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Hiển thị công khai
                </Label>
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
          <CardTitle>Danh Sách Sách</CardTitle>
          <CardDescription>Tổng số: {books.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : books.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Chưa có sách nào</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Ngày xuất bản</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book._id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        {book.publishedAt
                          ? format(new Date(book.publishedAt), 'dd/MM/yyyy', { locale: vi })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={book.isPublic ? 'default' : 'secondary'}>
                          {book.isPublic ? 'Công khai' : 'Riêng tư'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(book)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(book._id)}
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

