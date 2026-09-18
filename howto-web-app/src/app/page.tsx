'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './page.module.css';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Scroll reveal refs
  const featuresRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);

  // Scroll-triggered reveal animation
  const setupObserver = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll(`.${styles.scrollReveal}`);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mounted) {
      const cleanup = setupObserver();
      return cleanup;
    }
  }, [mounted, setupObserver]);

  if (!mounted) return null;

  return (
    <div className={styles.landing}>
      {/* Animated background */}
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
      <div className={styles.bgGlow3} />

      {/* Floating shapes */}
      <div className={`${styles.floatingShape} ${styles.floatingShape1}`} />
      <div className={`${styles.floatingShape} ${styles.floatingShape2}`} />
      <div className={`${styles.floatingShape} ${styles.floatingShape3}`} />
      <div className={`${styles.floatingShape} ${styles.floatingShape4}`} />

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>HowTo-Web</span>
        </div>
        <div className={styles.navLinks}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            type="button"
          >
            <span className="theme-toggle-icon">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => router.push('/login')}
          >
            Log In
          </button>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/signup')}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={`${styles.heroBadge} animate-fade-in`}>
            ✨ Presentations reimagined
          </div>
          <h1 className={`${styles.heroTitle} animate-fade-in-up`}>
            Present with
            <span className={styles.heroGradient}> everything </span>
            in one place
          </h1>
          <p className={`${styles.heroSubtitle} animate-fade-in-up delay-1`}>
            The presentation platform that keeps your slides, code, notes, files,
            and resources together. Fork, share, and collaborate like developers do.
          </p>
          <div className={`${styles.heroCtas} animate-fade-in-up delay-2`}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => router.push('/signup')}
            >
              Start Creating — Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works
            </button>
          </div>
        </div>

        {/* Hero Visual — The Signature Layout */}
        <div className={`${styles.heroVisual} animate-fade-in-up delay-3`}>
          <div className={styles.mockWindow}>
            <div className={styles.mockToolbar}>
              <div className={styles.mockDots}>
                <span /><span /><span />
              </div>
              <span className={styles.mockTitle}>Web Development — Slide 3</span>
              <div className={styles.mockActions}>
                <span className={styles.mockBtn}>▶ Present</span>
              </div>
            </div>
            <div className={styles.mockContent}>
              <div className={styles.mockSlide}>
                <div className={styles.mockSlideInner}>
                  <h3>What is JavaScript?</h3>
                  <p>The programming language of the web</p>
                  <div className={styles.mockCodeBlock}>
                    <code>{'console.log("Hello World!");'}</code>
                  </div>
                </div>
              </div>
              <div className={styles.mockDivider}>
                <div className={styles.mockDividerLine} />
              </div>
              <div className={styles.mockResources}>
                <div className={styles.mockResourceItem}>
                  <span>📝</span> Teacher Note
                </div>
                <div className={styles.mockResourceItem}>
                  <span>📄</span> script.js
                </div>
                <div className={styles.mockResourceItem}>
                  <span>📄</span> example.html
                </div>
                <div className={styles.mockResourceItem}>
                  <span>🎥</span> walkthrough.mp4
                </div>
                <div className={styles.mockResourceItem}>
                  <span>📕</span> reference.pdf
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features} ref={featuresRef}>
        <h2 className={`${styles.sectionTitle} ${styles.scrollReveal}`}>
          Everything a <span className={styles.heroGradient}>modern presentation</span> needs
        </h2>
        <p className={`${styles.sectionSubtitle} ${styles.scrollReveal}`}>
          Stop switching between apps. Keep everything in one powerful, shareable presentation.
        </p>

        <div className={styles.featureGrid}>
          <div className={`${styles.featureCard} ${styles.scrollReveal}`}>
            <div className={styles.featureIcon}>📐</div>
            <h3>70/30 Diagonal Layout</h3>
            <p>
              A unique split view with a stylish diagonal divider. Your slides on the left,
              resources on the right. Drag to resize.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.scrollReveal}`}>
            <div className={styles.featureIcon}>📎</div>
            <h3>Slide-Specific Resources</h3>
            <p>
              Attach notes, code files, PDFs, images, videos, and links to each individual slide.
              No more app switching.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.scrollReveal}`}>
            <div className={styles.featureIcon}>▶️</div>
            <h3>Live Code Preview</h3>
            <p>
              Run HTML/CSS/JS directly inside the presentation. Perfect for teaching
              web development without leaving your slides.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.scrollReveal}`}>
            <div className={styles.featureIcon}>🍴</div>
            <h3>Fork & Pull</h3>
            <p>
              Like GitHub for presentations. Fork anyone&apos;s public deck, make it yours,
              and pull updates when the original changes.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.scrollReveal}`}>
            <div className={styles.featureIcon}>🎥</div>
            <h3>Screen Sharing Ready</h3>
            <p>
              Designed to work perfectly when you share your screen on Meet, Zoom, Teams,
              or Discord. Everything stays inside one window.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.scrollReveal}`}>
            <div className={styles.featureIcon}>🔒</div>
            <h3>Public & Private</h3>
            <p>
              Keep your presentations private or share them with the world via a public URL.
              You control the visibility.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks} ref={howItWorksRef}>
        <h2 className={`${styles.sectionTitle} ${styles.scrollReveal}`}>
          How it <span className={styles.heroGradient}>works</span>
        </h2>
        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.scrollReveal}`}>
            <div className={styles.stepNumber}>1</div>
            <h3>Create</h3>
            <p>Build your presentation with text, images, and resources</p>
          </div>
          <div className={`${styles.step} ${styles.scrollReveal}`}>
            <div className={styles.stepNumber}>2</div>
            <h3>Attach</h3>
            <p>Add code files, notes, PDFs, and media to each slide</p>
          </div>
          <div className={`${styles.step} ${styles.scrollReveal}`}>
            <div className={styles.stepNumber}>3</div>
            <h3>Present</h3>
            <p>Share your screen and present everything from one window</p>
          </div>
          <div className={`${styles.step} ${styles.scrollReveal}`}>
            <div className={styles.stepNumber}>4</div>
            <h3>Share</h3>
            <p>Publish and let others fork your presentation</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta} ref={ctaRef}>
        <div className={`${styles.ctaCard} ${styles.scrollReveal}`}>
          <h2>Ready to present differently?</h2>
          <p>Join the platform where presentations meet collaboration.</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => router.push('/signup')}
          >
            Get Started — Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            <span className={styles.logoText}>HowTo-Web</span>
          </div>
          <p className={styles.footerText}>
            Built for teachers, creators, and developers who want more from their presentations.
          </p>
        </div>
      </footer>
    </div>
  );
}
