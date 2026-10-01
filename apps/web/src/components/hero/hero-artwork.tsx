'use client';
import dynamic from 'next/dynamic';
import { Component, useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { ConversationCurves } from '../conversation-curves';
import { HeroStatic } from './hero-static';
const Scene = dynamic(() => import('./hero-scene'), { ssr: false });
class SceneBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function HeroArtwork() {
  const ref = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const inView = useInView(ref, { amount: 0.15 });
  const reduced = useReducedMotion();
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = matchMedia(
      '(min-width: 1024px) and (hover: hover) and (pointer: fine)',
    );
    const update = () => setEligible(media.matches);
    const visibility = () => setVisible(!document.hidden);
    update();
    visibility();
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    if (!eligible || reduced || !inView || failed || loaded) return;
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) {
        setFailed(true);
        return;
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      setLoaded(true);
    } catch {
      setFailed(true);
    }
  }, [eligible, reduced, inView, failed, loaded]);
  const renderScene = loaded && eligible && !reduced && !failed;
  const active = renderScene && inView && visible;
  useEffect(() => {
    if (!renderScene) setReady(false);
  }, [renderScene]);
  return (
    <figure className="relative m-0 w-full min-w-0 self-center">
      <div
        ref={ref}
        aria-hidden="true"
        className="hero-artwork relative isolate aspect-[600/560] w-full overflow-hidden rounded-[32px]"
        data-scene={
          failed
            ? 'failed'
            : renderScene
              ? ready
                ? 'ready'
                : 'loading'
              : 'static'
        }
        data-rendering={active ? 'running' : 'paused'}
        onPointerMove={(event) => {
          if (!active) return;
          const r = event.currentTarget.getBoundingClientRect();
          pointer.current = {
            x: Math.max(
              -1,
              Math.min(1, ((event.clientX - r.left) / r.width - 0.5) * 2),
            ),
            y: Math.max(
              -1,
              Math.min(1, ((event.clientY - r.top) / r.height - 0.5) * 2),
            ),
          };
        }}
        onPointerLeave={() => {
          pointer.current = { x: 0, y: 0 };
        }}
      >
        <ConversationCurves variant="hero" className="inset-0 size-full" />
        <div className="pointer-events-none absolute inset-[12%] -z-10 rounded-full bg-violet/5 blur-3xl" />
        <HeroStatic
          className={`pointer-events-none absolute inset-0 size-full transition-opacity duration-500 motion-reduce:transition-none ${renderScene && ready ? 'opacity-0' : 'opacity-100'}`}
        />
        {renderScene && (
          <SceneBoundary onError={() => setFailed(true)}>
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
            >
              <Scene
                active={active}
                pointer={pointer}
                onReady={() => setReady(true)}
                onFailure={() => setFailed(true)}
              />
            </div>
          </SceneBoundary>
        )}
      </div>
      <figcaption className="relative mt-0 text-center text-xs leading-5 text-muted">
        An illustrative feedback journey · QR artwork is not scannable
      </figcaption>
    </figure>
  );
}
