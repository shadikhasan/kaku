'use client';

import { useI18n } from './language-provider';

import { useCallback, useEffect, useRef } from 'react';
import type { Point } from '@/lib/types';
import { samplePath } from '@/lib/handwriting';

type Props = {
  paths: string[];
  strokes: Point[][];
  stage: number;
  hint: boolean;
  grid: boolean;
  disabled: boolean;
  replay: number;
  onStroke: (points: Point[]) => void;
};

export default function WritingPad({ paths, strokes, stage, hint, grid, disabled, replay, onStroke }: Props) {
  const { t, n } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useRef<Point[]>([]);
  const pointer = useRef<number | null>(null);
  const latest = useRef({ strokes, onStroke, disabled });
  latest.current = { strokes, onStroke, disabled };

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const size = canvas.getBoundingClientRect().width;
    const ratio = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(size * ratio)) {
      canvas.width = Math.round(size * ratio);
      canvas.height = Math.round(size * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size, size);
    context.lineWidth = size * .019;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    const draw = (points: Point[], color: string) => {
      if (!points.length) return;
      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(points[0].x * size, points[0].y * size);
      for (let i = 1; i < points.length; i++) context.lineTo(points[i].x * size, points[i].y * size);
      context.stroke();
    };
    latest.current.strokes.forEach(points => draw(points, '#344b40'));
    draw(active.current, '#243c30');
  }, []);

  useEffect(() => { paint(); }, [strokes, paint]);
  useEffect(() => {
    const observer = new ResizeObserver(paint);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [paint]);

  const strokeIndex = strokes.length;
  const currentPath = paths[strokeIndex];
  let start: Point | undefined;
  if (currentPath && typeof document !== 'undefined') start = samplePath(currentPath)[0];
  const point = (event: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const cancelStroke = () => { active.current = []; pointer.current = null; paint(); };

  return <div className={`writing-pad ${disabled ? 'pad-complete' : ''}`}>
    <svg className="pad-guides" viewBox="0 0 109 109" aria-hidden="true">
      {grid && <g stroke="#e5e5db" strokeWidth=".3" strokeDasharray="1.2 1.4">
        <path d="M54.5 0V109M0 54.5H109" />
        <path d="M0 0L109 109M109 0L0 109" opacity=".45" />
      </g>}
      {(stage === 1 || hint) && paths.map((path, index) => <path key={index} d={path} fill="none" stroke="#dce0d5" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />)}
      {(stage === 0 || hint) && currentPath && <g key={`${strokeIndex}-${replay}`}>
        <path d={currentPath} fill="none" stroke="#b6c2ac" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
        <path className="animated-stroke" pathLength="1" d={currentPath} fill="none" stroke="#658258" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {start && <g>
          <circle cx={start.x * 109} cy={start.y * 109} r="3.2" fill="#4c6846" stroke="#fffef9" strokeWidth=".7" />
          <text x={start.x * 109} y={start.y * 109 + 1} textAnchor="middle" fill="white" fontSize="3" fontFamily="sans-serif">{n(strokeIndex + 1)}</text>
        </g>}
      </g>}
    </svg>
    <canvas ref={canvasRef} aria-label={t("Writing pad. {total} strokes, {done} completed.", { total: paths.length, done: strokeIndex })} role="application"
      onPointerDown={event => {
        if (latest.current.disabled || pointer.current !== null || event.button !== 0) return;
        event.preventDefault();
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        active.current = [point(event)];
        paint();
      }}
      onPointerMove={event => {
        if (pointer.current !== event.pointerId) return;
        event.preventDefault();
        active.current.push(point(event));
        paint();
      }}
      onPointerUp={event => {
        if (pointer.current !== event.pointerId) return;
        active.current.push(point(event));
        const result = [...active.current];
        active.current = [];
        pointer.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        latest.current.onStroke(result);
        paint();
      }}
      onPointerCancel={cancelStroke}
      onLostPointerCapture={() => { if (pointer.current !== null) cancelStroke(); }}
    />
    <span className="pad-corner top-left" /><span className="pad-corner bottom-right" />
  </div>;
}
