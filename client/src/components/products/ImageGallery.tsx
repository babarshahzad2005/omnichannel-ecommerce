import { useState } from "react";
import type { ProductImage } from "../../types/product";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const galleryImages = images.length > 0 ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = galleryImages[activeIndex];

  if (galleryImages.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {galleryImages.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
          {galleryImages.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                index === activeIndex
                  ? "border-cobalt-600"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <img
                src={image.url}
                alt={image.alt ?? `${productName} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="order-1 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:order-2">
        <img
          src={activeImage.url}
          alt={activeImage.alt ?? productName}
          className="aspect-square w-full object-cover"
        />
      </div>
    </div>
  );
}
