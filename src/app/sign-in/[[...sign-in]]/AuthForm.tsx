"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "code";
type AuthStrategy = "sign-in" | "sign-up";

type ClerkError = { errors?: { code?: string; longMessage?: string }[] };

export default function AuthForm() {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [authStrategy, setAuthStrategy] = useState<AuthStrategy>("sign-in");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;
    setLoading(true);
    setError(null);

    try {
      // Try existing-user sign-in first — sends OTP immediately
      await signIn.create({ identifier: email, strategy: "email_code" });
      setAuthStrategy("sign-in");
      setStep("code");
    } catch (signInErr: unknown) {
      const isNoUser = (signInErr as ClerkError)?.errors?.some(
        (e) => e.code === "form_identifier_not_found"
      );
      if (isNoUser) {
        // New user — create account and send OTP
        try {
          await signUp.create({ emailAddress: email });
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setAuthStrategy("sign-up");
          setStep("code");
        } catch (signUpErr: unknown) {
          const msg = (signUpErr as ClerkError)?.errors?.[0]?.longMessage;
          setError(msg ?? "Something went wrong. Please try again.");
        }
      } else {
        const msg = (signInErr as ClerkError)?.errors?.[0]?.longMessage;
        setError(msg ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;
    setLoading(true);
    setError(null);

    try {
      if (authStrategy === "sign-in") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code,
        });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          router.push("/profile");
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          router.push("/profile");
        }
      }
    } catch (err: unknown) {
      console.error("Verification failed:", err);
      const msg = (err as ClerkError)?.errors?.[0]?.longMessage;
      setError(msg ?? "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block mb-6">
            <img
              src="/images/logo_white.png"
              alt="DiscoverTrailRaces"
              className="h-10 mx-auto"
              style={{ filter: "invert(1)" }}
            />
          </a>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {step === "email" ? "Create Your Account / Sign In" : "Check your email"}
          </h1>
          <p className="text-neutral-500 text-sm">
            {step === "email"
              ? "Please enter your email address to continue"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          {step === "email" ? (
            <form onSubmit={handleEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !signInLoaded || !signUpLoaded}
                className="w-full bg-[#1a2e4a] hover:bg-[#243d5e] text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "Continue with email"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  placeholder="123456"
                  maxLength={6}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm tracking-[0.4em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full bg-[#1a2e4a] hover:bg-[#243d5e] text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify code"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(null); setCode(""); }}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700 py-1 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
