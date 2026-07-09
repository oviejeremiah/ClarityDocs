import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../api/auth.api';
import { ErrorBanner } from '../components/ErrorBanner/ErrorBanner';

type FormValues = { email: string; password: string };

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login(values);
      localStorage.setItem('clarity_token', response.accessToken);
      localStorage.setItem('clarity_user', JSON.stringify(response.user));
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo">
          <div className="login-card__logo-mark">CD</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>ClarityDocs</div>
        </div>
        <div className="login-card__title">Sign in</div>
        <div className="login-card__subtitle">Document intelligence platform</div>

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className={`input${errors.email ? ' input--error' : ''}`}
              placeholder="admin@claritydocs.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className="form-error" role="alert">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className={`input${errors.password ? ' input--error' : ''}`}
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span className="form-error" role="alert">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn--primary login-card__submit" disabled={isLoading}>
            {isLoading ? (
              <><div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#fff' }} /> Signing in…</>
            ) : 'Sign in'}
          </button>
        </form>

        <div className="login-card__footer">
          Turn documents into decisions
        </div>
      </div>
    </div>
  );
}