import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InputField = ({ icon: Icon, type = 'text', placeholder, value, onChange, error, rightEl }) => (
  <div>
    <div className="relative">
      <Icon
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-muted)' }}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: 'var(--surface-alt)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
        }}
      />
      {rightEl && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
      )}
    </div>
    {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
  </div>
);

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('tab') === 'register');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [form, setForm] = useState({
    username: '', email: '', phone_number: '',
    password: '', confirm_password: '',
  });
  const [errors, setErrors] = useState({});

  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
    setGlobalError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username required';
    if (!form.password) errs.password = 'Password required';
    if (isRegister) {
      if (!form.email.trim()) errs.email = 'Email required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
      if (form.phone_number && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone_number))
        errs.phone_number = 'Invalid phone number';
      if (!form.confirm_password) errs.confirm_password = 'Confirm your password';
      else if (form.password !== form.confirm_password)
        errs.confirm_password = 'Passwords do not match';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError('');
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login({ username: form.username, password: form.password });
      }
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {})?.[0]?.[0] ||
        'Something went wrong. Try again.';
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    setIsRegister((v) => !v);
    setErrors({});
    setGlobalError('');
    setForm({ username: '', email: '', phone_number: '', password: '', confirm_password: '' });
  };

  const eyeToggle = (showSetter) => (
    <button
      type="button"
      onClick={() => showSetter((v) => !v)}
      style={{ color: 'var(--text-muted)' }}
    >
      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 md:py-8"
      style={{ background: 'var(--background)' }}
    >
      {/* Background blob */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'var(--secondary)' }}
      />

      <div
        className="w-full max-w-md relative z-10"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          className="p-6 pb-0 text-center"
        >
          <div className="flex justify-center mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--primary)' }}
            >
              <BookOpen size={22} style={{ color: 'var(--background)' }} />
            </div>
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-lora)', color: 'var(--text-primary)' }}
          >
            {isRegister ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Join Readora today' : 'Sign in to your reading space'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mt-6 px-6">
          {['Login', 'Register'].map((tab) => (
            <button
              key={tab}
              onClick={() => (tab === 'Login' ? !isRegister || toggle() : isRegister || toggle())}
              className="flex-1 py-2 text-sm font-medium transition-all duration-200"
              style={{
                borderBottom: `2px solid ${
                  (tab === 'Register') === isRegister
                    ? 'var(--secondary)'
                    : 'var(--border)'
                }`,
                color:
                  (tab === 'Register') === isRegister
                    ? 'var(--secondary)'
                    : 'var(--text-muted)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <InputField
            icon={User}
            placeholder="Username"
            value={form.username}
            onChange={set('username')}
            error={errors.username}
          />

          {isRegister && (
            <>
              <InputField
                icon={Mail}
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
              />
              <InputField
                icon={Phone}
                type="tel"
                placeholder="Phone number (optional)"
                value={form.phone_number}
                onChange={set('phone_number')}
                error={errors.phone_number}
              />
            </>
          )}

          <InputField
            icon={Lock}
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            rightEl={eyeToggle(setShowPw)}
          />

          {isRegister && (
            <InputField
              icon={Lock}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm password"
              value={form.confirm_password}
              onChange={set('confirm_password')}
              error={errors.confirm_password}
              rightEl={eyeToggle(setShowConfirm)}
            />
          )}

          {globalError && (
            <div
              className="p-3 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {globalError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-85 active:scale-95 disabled:opacity-50 mt-2"
            style={{ background: 'var(--primary)', color: 'var(--background)' }}
          >
            {loading ? (isRegister ? 'Creating...' : 'Signing in...') : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs pb-6" style={{ color: 'var(--text-muted)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={toggle}
            className="font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--secondary)' }}
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
