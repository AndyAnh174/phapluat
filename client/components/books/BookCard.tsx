'use client';

import { useState } from 'react';
import { Book } from '@/lib/api';
import Image from 'next/image';
import { BookDetailModal } from './BookDetailModal';

interface BookCardProps {
  book: Book;
  index: number;
  onClick?: () => void;
}

export function BookCard({ book, index, onClick }: BookCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div
        className="bg-gradient-to-br from-white to-red-50 rounded-lg overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] group border border-red-100"
        onClick={handleClick}
      >
        {/* Book Cover/Image Area */}
        {book.coverImageUrl ? (
          <div className="relative w-full h-64 bg-gradient-to-br from-gray-50 to-red-50 overflow-hidden">
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent group-hover:from-red-900/30 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-full shadow-lg">
                <span className="text-sm font-medium">Xem chi tiết</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Text Content */}
        <div className="p-4 bg-gradient-to-b from-white to-red-50/50">
          <h3 className="font-bold text-red-900 text-base mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-gray-700 line-clamp-3">
            {book.description || book.subtitle || 'Không có mô tả'}
          </p>
        </div>
      </div>

      <BookDetailModal
        book={book}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        index={index}
      />
    </>
  );
}

