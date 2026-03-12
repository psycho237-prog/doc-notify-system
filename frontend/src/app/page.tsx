"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Special case for initial setup (Mock login)
    if (email === "admin@nnlomne.gov" && password === "password") {
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("institutionId", "nnlomne");
      router.push("/dashboard");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("institutionId", "nnlomne"); // Default for now
      router.push("/dashboard");
    } catch (err: unknown) {
      setError("Invalid credentials. Use admin@nnlomne.gov / password for testing.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-dot-pattern flex items-center justify-center flex-col relative py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg mb-6">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-center">
            NNLOMNE Notify
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Smart notifications for administrative services
          </p>
        </div>

        <div className="w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-100 z-10 glass-card">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.gov"
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-[#1e3a8a] hover:text-blue-800 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all font-mono"
              />
            </div>

            {error && (
              <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-6 rounded-xl font-semibold shadow-lg transition-all active:scale-[0.98]">
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="pt-4 flex items-center justify-center space-x-2 text-gray-400 text-xs border-t border-gray-100 mt-6">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure Government Access Only</span>
            </div>
          </form>
        </div>
      </div>

      <div className="absolute bottom-8 w-full text-center text-sm text-gray-500">
        <p>© 2023 NNLOMNE Administrative Services.</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
