"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface ModernLoginSignupProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export default function Component({
  redirectUrl = '/dashboard',
  onSuccess,
  initialIsLogin = true,
}: {
  redirectUrl?: string;
  onSuccess?: () => void;
  initialIsLogin?: boolean;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, signInAsGuest, user } = useAuth();

  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (onSuccess) onSuccess();
      else router.push(redirectUrl);
    }
  }, [user, onSuccess, redirectUrl, router]);

  // Handle Three.js Canvas Animation
  useEffect(() => {
    let active = true;
    let renderer: any;
    let geometry: any;
    let material: any;
    let scene: any;
    let camera: any;
    let animationId: number;

    const initThree = (THREE: any) => {
      if (!canvasRef.current || !active) return;
      const canvas = canvasRef.current;
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
        u_opacities: { value: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0] },
        u_colors: {
          value: [
            new THREE.Vector3(0.39, 0.40, 0.95), // Indigo
            new THREE.Vector3(0.55, 0.36, 0.96), // Violet
            new THREE.Vector3(0.22, 0.74, 0.97), // Cyan
            new THREE.Vector3(0.96, 0.62, 0.04), // Amber
            new THREE.Vector3(0.96, 0.25, 0.37), // Rose
            new THREE.Vector3(0.06, 0.72, 0.51), // Emerald
          ],
        },
        u_total_size: { value: 20.0 },
        u_dot_size: { value: 5.5 },
        u_reverse: { value: 0 },
      };

      material = new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main() {
            gl_Position = vec4(position, 1.0);
            fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: `
          precision mediump float;
          in vec2 fragCoord;

          uniform float u_time;
          uniform float u_opacities[10];
          uniform vec3 u_colors[6];
          uniform float u_total_size;
          uniform float u_dot_size;
          uniform vec2 u_resolution;
          uniform int u_reverse;

          out vec4 fragColor;

          float PHI = 1.61803398874989484820459;
          float random(vec2 xy) {
              return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
          }

          void main() {
              vec2 st = fragCoord.xy;
              st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
              st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

              float opacity = step(0.0, st.x) * step(0.0, st.y);

              vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

              float frequency = 5.0;
              float show_offset = random(st2);
              float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
              opacity *= u_opacities[int(rand * 10.0)];
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

              vec3 color = u_colors[int(show_offset * 6.0)];

              float animation_speed_factor = 3.0;
              vec2 center_grid = u_resolution / 2.0 / u_total_size;
              float dist_from_center = distance(center_grid, st2);

              float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

              float current_timing_offset = timing_offset_intro;
              opacity *= step(current_timing_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

              fragColor = vec4(color, opacity);
              fragColor.rgb *= fragColor.a;
          }
        `,
        uniforms: uniforms,
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
        transparent: true,
      });

      geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const startTime = performance.now();
      const animate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    if ((window as any).THREE) {
      const cleanUp = initThree((window as any).THREE);
      return () => {
        active = false;
        if (cleanUp) cleanUp();
        if (animationId) cancelAnimationFrame(animationId);
        if (renderer) renderer.dispose();
        if (geometry) geometry.dispose();
        if (material) material.dispose();
      };
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).THREE) {
          initThree((window as any).THREE);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, []);

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in both email and password');
      return;
    }
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Welcome back!');
      } else {
        await signUp(email, password, fullName || 'Creator');
        toast.success('Account created successfully!');
      }
      if (onSuccess) onSuccess();
      else router.push(redirectUrl);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        toast.error('Invalid email or password. Please check your credentials or continue as guest.');
      } else if (code === 'auth/email-already-in-use') {
        toast.error('Email is already registered. Please Sign In.');
        setIsLogin(true);
      } else if (code === 'auth/weak-password') {
        toast.error('Password must be at least 6 characters.');
      } else {
        toast.error(err?.message || 'Authentication error. You can also continue as guest.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign In Handler
  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
      if (onSuccess) onSuccess();
      else router.push(redirectUrl);
    } catch (err: any) {
      const code = err?.code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        toast.error('Google sign-in was not completed. Please try again or continue as guest.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Guest Mode Handler
  const handleGuest = async () => {
    setIsLoading(true);
    try {
      await signInAsGuest();
      toast.success('Welcome to HowTo-Web Studio!');
      if (onSuccess) onSuccess();
      else router.push(redirectUrl);
    } catch {
      toast.error('Failed to start guest session');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── shared styles ─── */
  const socialBtn: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#fff',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '0.45rem',
    transition: 'all 0.15s ease',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: '#07090e',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const GoogleIcon = (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  const LightningIcon = (
    <svg viewBox="0 0 24 24" fill="#f59e0b" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );

  const Logo = (
    <div
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
        width: 46,
        height: 46,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '1.25rem',
        marginBottom: '0.75rem',
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
        color: '#ffffff',
      }}
    >
      HW
    </div>
  );

  const Footer = (
    <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5, textAlign: 'center' }}>
      HowTo-Web Dynamic Presentation Platform<br />
      Interactive 70/30 Presentations with Live Resources
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#07090e',
        color: '#fff',
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', -apple-system, sans-serif)",
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* WebGL Dot canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'radial-gradient(circle at center, rgba(7,9,14,0.6) 0%, rgba(7,9,14,0.95) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Back to Home Link */}
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          color: '#cbd5e1',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ← Back to Home
      </button>

      {/* Modal Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(14, 19, 32, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          padding: '2rem',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {isLogin ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {Logo}
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
              Sign in to HowTo-Web
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.5 }}>
              Access your interactive presentations & studio.
            </p>

            {/* Instant Guest Access Button */}
            <button
              onClick={handleGuest}
              disabled={isLoading}
              style={{
                ...socialBtn,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.25))',
                border: '1.5px solid rgba(99, 102, 241, 0.5)',
                color: '#f8fafc',
                fontWeight: 600,
                marginBottom: '0.85rem',
              }}
              title="Explore HowTo-Web without signing in"
            >
              {LightningIcon} Continue as Guest
            </button>

            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                style={inputStyle}
                type="email"
                placeholder="Email (e.g. name@example.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={inputStyle}
                type="password"
                placeholder="Password (minimum 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                {isLoading ? 'Signing in...' : 'Sign In with Email'}
              </button>
            </form>

            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', width: '100%', margin: '1rem 0' }} />

            <button style={socialBtn} onClick={handleGoogle} disabled={isLoading}>
              {GoogleIcon} Continue with Google
            </button>

            <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                style={{
                  color: '#38bdf8',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                Sign Up
              </button>
            </div>
            {Footer}
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {Logo}
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
              Create an Account
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.5 }}>
              Start creating dynamic, interactive presentations.
            </p>

            {/* Instant Guest Access Button */}
            <button
              onClick={handleGuest}
              disabled={isLoading}
              style={{
                ...socialBtn,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(56, 189, 248, 0.25))',
                border: '1.5px solid rgba(99, 102, 241, 0.5)',
                color: '#f8fafc',
                fontWeight: 600,
                marginBottom: '0.85rem',
              }}
              title="Explore HowTo-Web without signing in"
            >
              {LightningIcon} Continue as Guest
            </button>

            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                style={inputStyle}
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <input
                style={inputStyle}
                type="email"
                placeholder="Email (e.g. name@example.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={inputStyle}
                type="password"
                placeholder="Password (minimum 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                {isLoading ? 'Creating account...' : 'Sign Up with Email'}
              </button>
            </form>

            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', width: '100%', margin: '1rem 0' }} />

            <button style={socialBtn} onClick={handleGoogle} disabled={isLoading}>
              {GoogleIcon} Continue with Google
            </button>

            <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                style={{
                  color: '#38bdf8',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                Sign In
              </button>
            </div>
            {Footer}
          </div>
        )}
      </div>
    </div>
  );
}
