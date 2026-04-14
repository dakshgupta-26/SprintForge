import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/signup" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Signup
        </Link>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Terms of Service</h1>
        </div>

        <div className="space-y-12 text-muted-foreground leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
            <p>
              Welcome to SprintForge. By accessing or using our agile project management platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Usage Rules</h2>
            <p>
              When using SprintForge, you agree to adhere to the following rules:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must not misuse the platform or disrupt its operations.</li>
              <li>You shall not use the service for any illegal activities or to promote unauthorized content.</li>
              <li>Automated scraping, bot networking, and harmful penetration testing without prior authorization is strictly prohibited.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. Account Responsibility</h2>
            <p>
              You are responsible for safeguarding the password that you use to access SprintForge and for any activities or actions under your password. We cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. Project Data & Ownership</h2>
            <p>
              We respect your intellectual property. You retain any and all of your rights to any content, code, project planning data, and assets you submit, post or display on or through SprintForge. You are the sole owner of your project data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">5. Termination</h2>
            <p>
              We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Accounts found participating in spam or illegal operations will be removed permanently.
            </p>
          </section>

          <section className="space-y-4 pt-8 border-t border-border">
            <p className="text-sm">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
