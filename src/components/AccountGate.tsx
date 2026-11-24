import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, ListTodo } from 'lucide-react';
import App from '../App';

type User = { id: string; email: string };

async function accountRequest(path: string, body?: object) {
  const response = await fetch(`/api/auth/${path}`, body && {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Unable to reach TaskFlow. Try again.');
  return result;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}

const inputClass = 'mt-2 w-full rounded-xl border border-[var(--tf-border-strong)] bg-[var(--tf-surface)] px-3.5 py-2.5 text-sm';

export function AccountGate() {
  const [user, setUser] = useState<User | null>();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void accountRequest('session')
      .then((result) => setUser(result.user ?? null))
      .catch((failure: unknown) => {
        setError(errorMessage(failure));
        setUser(null);
      });
    const onExpiry = () => {
      setError('Your session ended. Sign in to continue.');
      setUser(null);
    };
    window.addEventListener('taskflow-session-expired', onExpiry);
    return () => window.removeEventListener('taskflow-session-expired', onExpiry);
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    const path = user ? '/dashboard' : '/login';
    if (window.location.pathname !== path) window.history.replaceState(null, '', path);
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await accountRequest(register ? 'register' : 'login', {
        email, password, remember,
      });
      setPassword('');
      setUser(result.user);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError('');
    try {
      await accountRequest('logout', {});
      setRegister(false);
      setEmail(user?.email ?? '');
      setUser(null);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <>
        <App key={user.id} onSignOut={() => void signOut()} isSigningOut={busy} />
        {error && <p role="alert" className="fixed bottom-4 right-4 z-50 rounded-xl bg-[var(--tf-surface-solid)] p-3 shadow-lg">{error}</p>}
      </>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <section aria-labelledby="account-title" className="w-full max-w-sm rounded-3xl border border-[var(--tf-border)] bg-[var(--tf-surface-solid)] p-6 shadow-[var(--tf-shadow-2)] sm:p-8">
        <div className="mb-7 flex items-center gap-2.5 text-sm font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--tf-accent)] text-white">
            <ListTodo className="size-5" aria-hidden="true" />
          </span>
          TaskFlow
        </div>
        <h1 id="account-title" className="text-2xl font-semibold tracking-tight">
          {register ? 'Create your account' : 'Sign in to TaskFlow'}
        </h1>
        {user === undefined ? <p role="status" className="mt-4 text-sm">Checking your session…</p> : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Email address
                <input type="email" name="username" autoComplete="username" required maxLength={254}
                  className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input type="password" name="password" autoComplete={register ? 'new-password' : 'current-password'}
                  required minLength={register ? 8 : undefined} maxLength={128}
                  className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              {register && <p className="text-sm text-[var(--tf-ink-secondary)]">Use at least 8 characters.</p>}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)}
                  className="size-4 accent-[var(--tf-accent)]" />
                Keep me signed in for 30 days
              </label>
              {error && <p role="alert" className="text-sm text-[var(--tf-danger-ink)]">{error}</p>}
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--tf-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--tf-accent-hover)] disabled:opacity-60">
                {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </form>
            <button type="button" disabled={busy} className="mt-5 text-sm font-medium text-[var(--tf-accent-ink)] hover:underline"
              onClick={() => { setRegister(!register); setPassword(''); setError(''); }}>
              {register ? 'Already have an account? Sign in' : 'New to TaskFlow? Create an account'}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
