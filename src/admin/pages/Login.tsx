import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/admin", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    const ok = await login({ email: email.trim().toLowerCase(), password });
    if (ok) navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Questify Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Management Console</p>
        </div>

        <Card className="border-slate-700 bg-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Only support and super_admin accounts can access this portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-800 bg-red-950 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-slate-300">Email address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading || !email || !password}
              >
                {loading ? "Signing in…" : "Sign in to Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-xs mt-6">
          This portal is restricted to authorized personnel only.
        </p>
      </div>
    </div>
  );
}
