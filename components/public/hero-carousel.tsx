"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
    alt: "Graduating students gathered outdoors on campus",
  },
  {
    src: "https://images.unsplash.com/photo-1583373834259-46cc92173cb7?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
    alt: "Students walking together through a university campus",
  },
  {
    src: "https://images.unsplash.com/photo-1564981797816-1043664bf78d",
    alt: "University students studying and collaborating",
  },
];

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const showPrevious = () => {
    setActiveIndex(
      (current) => (current - 1 + HERO_IMAGES.length) % HERO_IMAGES.length,
    );
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % HERO_IMAGES.length);
  };

  return (
    <section
      className="relative min-h-72 overflow-hidden rounded-xl border border-white/10 bg-secondary/30 sm:min-h-80 lg:min-h-[390px]"
      aria-roledescription="carousel"
      aria-label="Campus highlights"
    >
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== activeIndex}
        >
          <Image
            src={`${image.src}?auto=format&fit=crop&w=1200&q=85`}
            alt={image.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <fieldset className="flex gap-2 border-0 p-0">
          <legend className="sr-only">Choose slide</legend>
          {HERO_IMAGES.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-7 bg-white"
                  : "w-1.5 bg-white/55 hover:bg-white/80"
              }`}
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </fieldset>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-9 rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md hover:bg-black/55"
            onClick={showPrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-9 rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md hover:bg-black/55"
            onClick={showNext}
            aria-label="Next image"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
