'use client';

import { Book } from '@/lib/api';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { X } from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index?: number;
}

export function BookDetailModal({ book, open, onOpenChange, index }: BookDetailModalProps) {
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[95vw] !w-[95vw] md:!max-w-[70vw] md:!w-[70vw] h-[90vh] md:h-[70vh] max-h-[90vh] md:max-h-[70vh] overflow-hidden p-0 bg-[#fef9e7] border-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Red Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-800 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {index && (
              <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-sm md:text-lg">{index}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-white text-sm md:text-xl font-bold mb-1 truncate">
                {book.title}
              </DialogTitle>
              {book.subtitle && (
                <div className="flex items-center gap-2">
                  <DialogDescription className="text-white/90 text-xs truncate">
                    {book.subtitle}
                  </DialogDescription>
                  <div className="w-8 md:w-12 h-0.5 bg-yellow-400 flex-shrink-0"></div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white hover:bg-white/20 rounded-full p-1.5 md:p-2 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Main Content - Light Yellow Background - Horizontal Layout */}
        <div className="overflow-y-auto flex-1 bg-[#fef9e7] p-3 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-full">
            {/* Left Column - Book Cover */}
            <div className="flex flex-col">
              {book.coverImageUrl && (
                <div className="relative w-full h-64 md:flex-1 md:min-h-[400px] bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
                  <Image
                    src={book.coverImageUrl}
                    alt={book.title}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
            </div>

            {/* Middle Column - Description */}
            <div className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2">Mô tả chi tiết</h3>
                <div className="text-xs md:text-sm text-gray-700 leading-relaxed overflow-y-auto max-h-[calc(90vh-400px)] md:max-h-[calc(85vh-300px)] pr-2">
                  <p className="whitespace-pre-line">
                    {book.description || book.subtitle || 'Không có mô tả chi tiết.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-3 md:space-y-4">
              {/* Trích dẫn */}
              {book.quote && (
                <div className="p-2 md:p-3 bg-pink-50 border-l-4 border-red-600 rounded">
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-2">Trích dẫn</h3>
                  <p className="text-xs text-gray-800 italic leading-relaxed">
                    &quot;{book.quote}&quot;
                  </p>
                </div>
              )}

              {/* Thông tin xuất bản */}
              {book.publishedAt && (
                <div className="p-2 md:p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-2">Thông tin xuất bản</h3>
                  <p className="text-xs text-gray-800">
                    {format(new Date(book.publishedAt), 'dd MMMM yyyy', { locale: vi })}
                  </p>
                </div>
              )}

              {/* Tác giả */}
              {book.author && (
                <div className="p-2 md:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <h3 className="text-xs md:text-sm font-bold text-blue-700 mb-2">Tác giả</h3>
                  <p className="text-xs md:text-sm font-medium text-gray-800">
                    {book.author}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Red Footer with Buttons */}
        <div className="bg-gradient-to-r from-red-700 to-red-800 px-3 md:px-6 py-2 md:py-3 flex items-center justify-center gap-2 md:gap-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-red-600 hover:bg-red-700 text-white border-red-500 px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base"
          >
            Đóng
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base"
          >
            Tìm hiểu thêm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

