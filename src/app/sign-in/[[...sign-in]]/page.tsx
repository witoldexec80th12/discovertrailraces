import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign In — DiscoverTrailRaces",
};

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
            Sign in to your account
          </h1>
          <p className="text-neutral-500 text-sm">
            We&apos;ll send a one-time code to your email — no password needed.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-neutral-200 rounded-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "hidden",
              dividerRow: "hidden",
              formFieldInput:
                "border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500",
              formButtonPrimary:
                "bg-[#1a2e4a] hover:bg-[#243d5e] text-white rounded-lg",
              footerAction: "text-neutral-500",
            },
          }}
        />
      </div>
    </main>
  );
}
