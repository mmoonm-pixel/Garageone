import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

type ParallaxImageProps = {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  width?: number;
  height?: number;
  srcSet?: string;
  sizes?: string;
};

/** A restrained background-image movement; the wrapper's layout and clipping belong to CSS. */
export default function ParallaxImage({
  src,
  alt,
  className,
  wrapperClassName,
  width,
  height,
  srcSet,
  sizes,
}: ParallaxImageProps) {
  const target = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-8, 8]);

  return <div ref={target} className={['parallax-image', wrapperClassName].filter(Boolean).join(' ')}>
    <motion.img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      srcSet={srcSet}
      sizes={sizes}
      loading="lazy"
      decoding="async"
      style={{ y: reducedMotion ? 0 : y, scale: reducedMotion ? 1 : 1.04 }}
    />
  </div>;
}
