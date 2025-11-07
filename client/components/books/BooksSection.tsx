'use client';

import { useEffect, useState } from 'react';
import { booksAPI, Book } from '@/lib/api';
import { BookCard } from './BookCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function BooksSection() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await booksAPI.getAll(1, 12);
        setBooks(response.data);
      } catch (err) {
        setError('Không thể tải danh sách sách');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4 bg-[#faf8f3]">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#8B0000] mb-3">
              BỘ SÁCH &quot;PHÁP LUẬT&quot;
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-[#faf8f3]">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#8B0000] mb-3">
              BỘ SÁCH &quot;PHÁP LUẬT&quot;
            </h2>
          </div>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  if (books.length === 0) {
    return (
      <section className="py-16 px-4 bg-[#faf8f3]">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#8B0000] mb-3">
              BỘ SÁCH &quot;PHÁP LUẬT&quot;
            </h2>
          </div>
          <p className="text-center text-muted-foreground">Chưa có sách nào được công bố</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-[#faf8f3]">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#8B0000] mb-3">
            BỘ SÁCH &quot;PHÁP LUẬT&quot;
          </h2>
          <div className="flex items-center justify-center mb-4">
            <div className="w-24 h-1 bg-yellow-400"></div>
          </div>
          <p className="text-gray-700 text-lg max-w-3xl mx-auto">
            Tuyển chọn  các văn bản pháp luật hiện hành, cẩm nang hướng dẫn thi hành và các ấn phẩm chuyên sâu phục vụ nghiên cứu, hành nghề và ứng dụng pháp luật tại Việt Nam.
          </p>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {books.map((book, index) => (
            <BookCard key={book._id} book={book} index={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

