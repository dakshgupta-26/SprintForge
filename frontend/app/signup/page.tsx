"use client";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { Sparkles, Eye, EyeOff, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { GoogleAuthButton } from "@/components/shared/GoogleAuthButton";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const prefillEmail = searchParams.get("email");

  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    try {
      await register(name, email, password);
      toast.success("Account created! Welcome to SprintForge 🚀");
      router.push(nextUrl || "/dashboard");
    } catch (err: any) {
      if (!err?.response) {
        toast.error("Cannot reach the server. Check if the backend is running.");
      } else {
        toast.error(err.response.data?.message || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-black text-lg">SprintForge</span>
      </div>

      <h1 className="text-3xl font-black mb-2">Create your account</h1>
      <p className="text-muted-foreground mb-6">Start building better software in minutes</p>

      {/* Google Signup Button */}
      <div className="mb-5">
        <GoogleAuthButton nextUrl={nextUrl} text="signup_with" />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-border w-full" />
        <span className="bg-background px-3 text-xs text-muted-foreground uppercase font-medium absolute">
          or register with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">Full name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">Work email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1">
              {passwordRules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                  <CheckCircle className={`w-3 h-3 ${rule.test(password) ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={rule.test(password) ? "text-green-500" : "text-muted-foreground"}>{rule.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 mt-2 cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>

      <p className="text-center text-xs text-muted-foreground mt-4">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-sm">Loading registration...</p>
            </div>
          }
        >
          <SignupForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
