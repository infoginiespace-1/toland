'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Play, Sparkles } from 'lucide-react';

export interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  image_path: string;
  link?: string | null;
  media_type?: 'image' | 'video' | 'gif' | string;
  sort?: number;
  is_active?: boolean;
}

interface HeroSliderProps {
  banners?: BannerSlide[];
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: 'default-1',
    title: 'Heavyweight Raw Selvedge Denim',
    subtitle: '13.5oz ring-spun combed cotton woven for lifetime durability',
    image_path: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1600&q=85',
    link: '/products?category=slim-fit-denim',
    media_type: 'image',
  },
  {
    id: 'default-2',
    title: 'Sheikhpura In-House Stonewashing',
    subtitle: 'Authentic vintage fades crafted using natural pumice stones',
    image_path: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1600&q=85',
    link: '/products',
    media_type: 'image',
  },
  {
    id: 'default-3',
    title: 'Heavyweight Trucker Jacket Series',
    subtitle: 'Reinforced chainstitching, solid brass hardware & classic silhouette',
    image_path: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=1600&q=85',
    link: '/products?category=casual-jackets-shirts',
    media_type: 'image',
  },
];

export function HeroSlider({ banners = [] }: HeroSliderProps) {
  const activeBanners = banners && banners.length > 0
    ? banners.filter((b) => b.is_active !== false)
    : DEFAULT_SLIDES;

  const slides = activeBanners.length > 0 ? activeBanners : DEFAULT_SLIDES;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Auto-advance slides every 5.5 seconds unless user hovers
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  // Handle slide change
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const isVideo = (slide: BannerSlide) => {
    if (slide.media_type === 'video') return true;
    const url = (slide.image_path || '').toLowerCase();
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/video/');
  };

  return (
    <div
      className="relative w-full aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5] xl:aspect-[1/1] rounded-2xl overflow-hidden border border-border shadow-card bg-surface-alt group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const videoMedia = isVideo(slide);

        return (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {videoMedia ? (
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                src={slide.image_path}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.image_path}
                alt={slide.title}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-103"
              />
            )}

            {/* Dark Gradient Overlay for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 flex flex-col justify-end p-6 sm:p-8 text-white">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider w-fit mb-3 border border-white/25">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Sheikhpura 811101 · Direct Mill</span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight max-w-md">
                {slide.title}
              </h3>

              {slide.subtitle && (
                <p className="text-xs sm:text-sm text-white/80 mt-1.5 max-w-sm line-clamp-2 leading-relaxed">
                  {slide.subtitle}
                </p>
              )}

              {/* CTA Link Button */}
              <div className="pt-4">
                <Link
                  href={slide.link || '/products'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Prev / Next Controls (Only if more than 1 slide) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-white/20 shadow-md cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-white/20 shadow-md cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator / Progress Bars */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all rounded-full h-1.5 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-white shadow-sm'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
