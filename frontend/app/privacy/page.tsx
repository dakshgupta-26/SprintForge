import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-black text-foreground">Privacy Policy</h1>
        </div>

        <div className="space-y-12 text-muted-foreground leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Data Collection</h2>
            <p>
              When you use SprintForge, we collect essential information strictly necessary for providing our project management services. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your Name and Email Address for authentication and notifications.</li>
              <li>Project Data including tasks, sprints, logs, and board configurations.</li>
              <li>Usage analytics to help us measure and improve performance.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Usage of Data</h2>
            <p>
              The data we collect is used primarily to furnish you with a personalized dashboard experience and to ensure real-time synchronization between your team members. We also leverage high-level analytics to diagnose platform stability and improve the overall user experience. We do not sell your personal data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. Data Security</h2>
            <p>
              We take security seriously. All project data is stored securely in encrypted databases. Communication over our real-time websocket protocols and REST APIs is heavily encrypted via SSL/TLS. Passwords map securely through hashing protocols before persistence.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. Third-Party Services</h2>
            <p>
              We may employ third-party companies and individuals to facilitate our Service (e.g., Cloud storage infrastructure, mailing, and potentially OAuth providers). These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">5. Your User Rights</h2>
            <p>
              You maintain full sovereignty over your data footprint. You have the right to request a complete export of your project data or request the permanent deletion of your account and all associated project materials by contacting our support team or deleting your account from the dashboard settings.
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
