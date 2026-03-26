import { Link } from 'react-router-dom';
import { BookOpen, Lock, MessageSquare, Zap, Shield, Sparkles } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Digital Library',
    desc: 'Access a growing collection of literature and academic resources in high-fidelity PDF format.',
  },
  {
    icon: Shield,
    title: 'Researcher Access',
    desc: 'Secure authentication ensures your reading list and personal data stay strictly private.',
  },
  {
    icon: MessageSquare,
    title: 'Document Annotations',
    desc: 'Advanced tools to manage your thoughts and annotations directly within the reading interface.',
  },
  {
    icon: Sparkles,
    title: 'Curated Collections',
    desc: 'Organize your library with custom bookmarks and a personalized digital bookshelf.',
  },
  {
    icon: Zap,
    title: 'Seamless Experience',
    desc: 'A lightning-fast, distraction-free environment designed for deep focus and reading.',
  },
  {
    icon: Shield,
    title: 'Minimalist Design',
    desc: 'A clean, modern interface that prioritizes content and ease of use above all else.',
  },
];

const LandingPage = () => {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)', color: 'var(--text-primary)' }}
    >
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        {/* Decorative blobs */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'var(--secondary)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'var(--accent)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 tracking-wider uppercase"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--secondary)',
            }}
          >
            <Sparkles size={12} />
            Explore. Research. Annotate.
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}
          >
            The sanctuary for <span style={{ color: 'var(--secondary)' }}>modern readers</span>
          </h1>

          <p
            className="text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Readora is a premium digital library for scholars and book lovers. 
            Access a curated collection of works in a distraction-free, academic environment.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth?tab=register"
              className="px-8 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 hover:opacity-85 hover:scale-105 active:scale-95"
              style={{ background: 'var(--primary)', color: 'var(--background)' }}
            >
              Start Reading Free
            </Link>
            <Link
              to="/auth"
              className="px-8 py-3.5 rounded-2xl text-base font-medium transition-all duration-200 hover:opacity-80"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce"
          style={{ color: 'var(--text-muted)' }}
        >
          <div
            className="w-0.5 h-8 rounded-full"
            style={{ background: 'var(--border)' }}
          />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}
          >
            Everything you need
          </h2>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
            Tools built to empower your literary journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--primary)', color: 'var(--background)' }}
              >
                <Icon size={20} />
              </div>
              <h3
                className="font-semibold text-base mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-16">
        <div
          className="max-w-2xl mx-auto text-center p-10 rounded-3xl relative overflow-hidden"
          style={{ background: 'var(--primary)' }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 30% 50%, var(--secondary), transparent 70%)' }}
          />
          <h2
            className="text-2xl md:text-3xl font-bold mb-3 relative z-10"
            style={{ fontFamily: 'var(--font-lora)', color: 'var(--background)' }}
          >
            Ready to explore?
          </h2>
          <p className="text-sm mb-6 relative z-10" style={{ color: 'rgba(224,225,221,0.7)' }}>
            Join Readora today and experience a more refined way to read and research.
          </p>
          <Link
            to="/auth?tab=register"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 relative z-10"
            style={{ background: 'var(--background)', color: 'var(--primary)' }}
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="text-center py-8 text-xs"
        style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
      >
        © {new Date().getFullYear()} Readora. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
