'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { booksAPI, Book } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const bookData = await booksAPI.getById(bookId);
        setBook(bookData);
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setError('Không tìm thấy sách');
        } else {
          setError('Không thể tải thông tin sách');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-700 to-orange-700 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-700 to-orange-700 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <p className="text-xl mb-4">{error || 'Không tìm thấy sách'}</p>
          <Button onClick={() => router.push('/')}>Về Trang Chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-700 to-orange-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        ></div>
      </div>

      <div className="relative z-10 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-8 text-white hover:text-yellow-300 hover:bg-white/10"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>

          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-16 h-0.5 bg-yellow-400"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="text-yellow-400">TIỂU SỬ, CUỘC ĐỜI</span>
              <div className="w-32 h-1 bg-yellow-400 mx-auto my-2"></div>
            </h1>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
              VÀ SỰ NGHIỆP
              <div className="w-32 h-1 bg-white mx-auto my-2"></div>
            </h2>
            
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400">
              {book.title.toUpperCase()}
            </h3>
          </div>

          {/* Quote Box */}
          {book.quote && (
            <div className="bg-[#5a1a1a] border-2 border-yellow-400 rounded-lg p-6 md:p-8 mb-8 text-center">
              <p className="text-white italic text-lg md:text-xl mb-3">
                &quot;{book.quote}&quot;
              </p>
              <p className="text-white text-sm md:text-base">
                — {book.author || 'Chủ tịch Hồ Chí Minh'} —
              </p>
            </div>
          )}

          {/* Book Cover and Description */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {book.coverImageUrl && (
              <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <div className="text-white space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-yellow-400">Mô tả</h3>
                <p className="text-base leading-relaxed">{book.description}</p>
              </div>
              
              {book.subtitle && (
                <div>
                  <h3 className="text-xl font-bold mb-2 text-yellow-400">Tiêu đề phụ</h3>
                  <p className="text-base">{book.subtitle}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-bold mb-2 text-yellow-400">Tác giả</h3>
                <p className="text-base">{book.author}</p>
              </div>
              
              {book.publishedAt && (
                <div>
                  <h3 className="text-xl font-bold mb-2 text-yellow-400">Ngày xuất bản</h3>
                  <p className="text-base">
                    {new Date(book.publishedAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section (if it's a biography book) */}
          {book.title.toLowerCase().includes('tiểu sử') || book.title.toLowerCase().includes('cuộc đời') ? (
            <div className="text-center mt-12">
              <div className="flex items-center justify-center gap-8 text-white">
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-bold mb-2">1890</div>
                  <div className="text-lg">SINH</div>
                </div>
                <div className="w-24 h-0.5 bg-yellow-400"></div>
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-bold mb-2">1969</div>
                  <div className="text-lg">MẤT</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

