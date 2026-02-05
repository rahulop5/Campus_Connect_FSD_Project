import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const SplitText = ({ 
  text, 
  className = '', 
  delay = 30,
  duration = 1,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 50 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '0px',
  textAlign = 'inherit',
  tag = 'div'
}) => {
  const containerRef = useRef(null);

  const splitTextIntoElements = () => {
    if (!text) return [];
    
    return text.split('').map((char, index) => (
      <span 
        key={index} 
        className="split-char"
        style={{ display: 'inline-block' }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  useGSAP(() => {
    if (!containerRef.current) return;

    const chars = containerRef.current.querySelectorAll('.split-char');
    
    if (chars.length === 0) return;

    gsap.fromTo(
      chars,
      from,
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: containerRef.current,
          start: `top ${100 - (threshold * 100)}%`,
          once: true,
        }
      }
    );
  }, { scope: containerRef });

  const Tag = tag;

  return (
    <Tag 
      ref={containerRef} 
      className={className}
      style={{ textAlign }}
    >
      {splitTextIntoElements()}
    </Tag>
  );
};

export default SplitText;
