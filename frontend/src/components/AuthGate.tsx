
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";

type Props = {
  children: ReactNode;
};

const usernameSuggestions = [
  "WanderSoul",
  "RoamingStar",
  "TravelMuse",
  "HappyExplorer",
  "DreamyNomad",
  "HiddenGemHunter",
];

export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) setMessage(error.message);
      setSession(data.session);
      setReady(true);
    }

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setReady(true);
      },
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const savedUsername = String(
    session?.user.user_metadata?.username ?? "",
  ).trim();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          setSession(data.session);
          setMessage("");
        } else {
          setMessage(
            "Your account has been created. Confirm your email, then sign in to choose your username.",
          );
        }
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) throw error;

        setSession(data.session);
        setUsername(
          String(data.session.user.user_metadata?.username ?? ""),
        );
        setMessage("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleaned = username.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleaned)) {
      setMessage(
        "Use 3–20 characters: letters, numbers, or underscores.",
      );
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { username: cleaned },
      });

      if (error) throw error;

      if (data.user) {
        setSession((current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  user_metadata: data.user.user_metadata,
                },
              }
            : current,
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Couldn't save your username. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setMessage("");
      setUsername("");
      setPassword("");
      setMode("login");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Couldn't sign out.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className="auth-loading">
        <div className="loading-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p>Getting your next adventure ready…</p>
      </main>
    );
  }

  if (session && !savedUsername) {
    return (
      <main className="auth-page">
        <section className="auth-card username-card">
          <div className="auth-brand">
            <span className="brand-icon">✦</span>
            <span>Wanderwise</span>
          </div>

          <div className="auth-illustration username-illustration">
            <span className="illustration-sun">☀</span>
            <span className="illustration-mountain">⌁</span>
            <span className="illustration-plane">✈</span>
          </div>

          <p className="auth-eyebrow">YOUR JOURNEY STARTS HERE</p>
          <h1>What should we call you?</h1>
          <p className="auth-description">
            Choose a username for your travel profile. You can use
            your own idea or pick a suggestion.
          </p>

          <form className="auth-form" onSubmit={saveUsername}>
            <label htmlFor="username">Your username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setMessage("");
              }}
              placeholder="e.g. CuriousExplorer"
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]{3,20}"
              autoComplete="nickname"
              required
            />

            <p className="field-hint">
              3–20 characters. Letters, numbers and underscores only.
            </p>

            <p className="suggestion-label">NEED AN IDEA?</p>
            <div className="username-suggestions">
              {usernameSuggestions.map((suggestion) => (
                <button
                  type="button"
                  className="suggestion-chip"
                  key={suggestion}
                  onClick={() => {
                    setUsername(suggestion);
                    setMessage("");
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {message && (
              <p className="auth-message auth-error" role="alert">
                {message}
              </p>
            )}

            <button
              className="auth-primary"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="button-spinner" />
                  Saving…
                </>
              ) : (
                "Let's explore →"
              )}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (session) {
    return (
      <div className="authenticated-shell">
        <header className="app-account-bar">
          <div className="auth-brand">
            <span className="brand-icon">✦</span>
            <span>Wanderwise</span>
          </div>

          <div className="account-actions">
            <span className="account-greeting">
              Hi, {savedUsername}!
            </span>
            <button
              className="signout-button"
              type="button"
              onClick={signOut}
              disabled={busy}
            >
              Sign out
            </button>
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">✦</span>
          <span>Wanderwise</span>
        </div>

        <div className="auth-illustration" aria-hidden="true">
          <span className="illustration-sun">☀</span>
          <span className="illustration-mountain">⌁</span>
          <span className="illustration-plane">✈</span>
          <span className="illustration-sparkle sparkle-one">✦</span>
          <span className="illustration-sparkle sparkle-two">✧</span>
        </div>

        <p className="auth-eyebrow">
          {mode === "login" ? "YOUR NEXT CHAPTER AWAITS" : "FIND YOUR WAY"}
        </p>

        <h1>
          {mode === "login"
            ? "The world is waiting."
            : "Let's plan something wonderful."}
        </h1>

        <p className="auth-description">
          {mode === "login"
            ? "Welcome back! Sign in to pick up where your adventures left off."
            : "Create your account and turn your travel ideas into a personalized adventure."}
        </p>

        <div className="auth-mode-switch" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="auth-password">Password</label>
          <div className="password-field">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={8}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {message && (
            <p className="auth-message" role="alert">
              {message}
            </p>
          )}

          <button className="auth-primary" type="submit" disabled={busy}>
            {busy ? (
              <>
                <span className="button-spinner" />
                Please wait…
              </>
            ) : mode === "login" ? (
              "Sign in and explore →"
            ) : (
              "Create my account →"
            )}
          </button>
        </form>

        <p className="auth-footer">
          {mode === "login"
            ? "New here? Create an account to start planning."
            : "Already have an account? Switch to Sign in above."}
        </p>
      </section>

      <aside className="auth-side-panel">
        <div className="side-panel-content">
          <span className="side-panel-tag">LESS SCROLLING. MORE EXPLORING.</span>
          <h2>Your kind of trip.<br />Your kind of world.</h2>
          <p>
            Discover experiences shaped around your interests,
            your pace, and the places you've always wanted to see.
          </p>
          <div className="travel-pills">
            <span>☀ Slow mornings</span>
            <span>⌁ Hidden places</span>
            <span>✧ Your own adventure</span>
          </div>
        </div>
        <div className="side-panel-footer">
          MADE FOR THE WAY YOU TRAVEL
        </div>
      </aside>
    </main>
  );
}