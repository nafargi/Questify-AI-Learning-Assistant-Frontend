import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Brain,
  Eye,
  EyeSlash,
  ArrowRight,
  Shield,
  Sparkle,
  CheckCircle,
  Warning,
  CircleNotch,
  ArrowLeft,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Flow states
type Flow = "login" | "register" | "verify-otp" | "forgot-password" | "reset-password";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, verifyOtp, resendOtp, forgotPassword, resetPassword } = useAuth();

  const [flow, setFlow] = useState<Flow>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    const { error, unverified } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      if (unverified) {
        toast.error("Account not verified. Check your email for the OTP.");
        setFlow("verify-otp");
      } else {
        toast.error(error);
      }
      return;
    }
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    setIsLoading(false);
    if (error) { toast.error(error); return; }
    toast.success("OTP sent to your email. Please verify your account.");
    setFlow("verify-otp");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsLoading(true);
    const { error } = await verifyOtp(email, otp);
    setIsLoading(false);
    if (error) { toast.error(error); return; }
    toast.success("Account verified! You can now sign in.");
    setOtp("");
    setFlow("login");
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    const { error } = await resendOtp(email);
    setIsLoading(false);
    if (error) { toast.error(error); return; }
    toast.success("OTP resent to your email.");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    const { error } = await forgotPassword(email);
    setIsLoading(false);
    if (error) { toast.error(error); return; }
    toast.success("Reset OTP sent to your email.");
    setFlow("reset-password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return;
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setIsLoading(true);
    const { error } = await resetPassword(email, otp, newPassword);
    setIsLoading(false);
    if (error) { toast.error(error); return; }
    toast.success("Password reset successfully. Please sign in.");
    setOtp("");
    setNewPassword("");
    setFlow("login");
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderForm = () => {
    switch (flow) {
      case "login":
        return (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"}
                  placeholder="Enter your password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="h-12 pr-12" required />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                  {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setFlow("forgot-password")}
                className="text-sm text-primary hover:text-primary/80 font-medium">
                Forgot password?
              </button>
            </div>
            <Button type="submit" disabled={isLoading}
              className="w-full h-12 gradient-primary text-primary-foreground font-medium text-base shadow-glow group">
              {isLoading ? <CircleNotch className="w-5 h-5 animate-spin" /> : (
                <>Sign in <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </form>
        );

      case "register":
        return (
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" type="text" placeholder="Enter your name" value={name}
                onChange={(e) => setName(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password (8+ chars)" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="h-12 pr-12" required />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                  {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type={showPassword ? "text" : "password"}
                placeholder="Confirm your password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} className="h-12" required />
            </div>
            <Button type="submit" disabled={isLoading}
              className="w-full h-12 gradient-primary text-primary-foreground font-medium text-base shadow-glow group">
              {isLoading ? <CircleNotch className="w-5 h-5 animate-spin" /> : (
                <>Create account <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>
          </form>
        );

      case "verify-otp":
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input id="otp" type="text" inputMode="numeric" maxLength={6}
                placeholder="000000" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-center text-xl tracking-widest font-mono" required />
            </div>
            <Button type="submit" disabled={isLoading}
              className="w-full h-12 gradient-primary text-primary-foreground font-medium text-base shadow-glow">
              {isLoading ? <CircleNotch className="w-5 h-5 animate-spin" /> : "Verify account"}
            </Button>
            <button type="button" onClick={handleResendOtp} disabled={isLoading}
              className="w-full text-sm text-primary hover:text-primary/80 font-medium text-center">
              Didn't receive it? Resend OTP
            </button>
          </form>
        );

      case "forgot-password":
        return (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a reset code.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className="h-12" required />
            </div>
            <Button type="submit" disabled={isLoading}
              className="w-full h-12 gradient-primary text-primary-foreground font-medium text-base shadow-glow">
              {isLoading ? <CircleNotch className="w-5 h-5 animate-spin" /> : "Send reset code"}
            </Button>
          </form>
        );

      case "reset-password":
        return (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Enter the reset code sent to <span className="font-medium text-foreground">{email}</span> and your new password.
            </p>
            <div className="space-y-2">
              <Label htmlFor="otp">Reset code</Label>
              <Input id="otp" type="text" inputMode="numeric" maxLength={6}
                placeholder="000000" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-center text-xl tracking-widest font-mono" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input id="newPassword" type={showPassword ? "text" : "password"}
                  placeholder="New password (8+ chars)" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} className="h-12 pr-12" required />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                  {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading}
              className="w-full h-12 gradient-primary text-primary-foreground font-medium text-base shadow-glow">
              {isLoading ? <CircleNotch className="w-5 h-5 animate-spin" /> : "Reset password"}
            </Button>
          </form>
        );
    }
  };

  const flowTitle: Record<Flow, string> = {
    login: "Welcome back",
    register: "Begin your journey",
    "verify-otp": "Verify your email",
    "forgot-password": "Forgot password?",
    "reset-password": "Reset your password",
  };

  const flowSubtitle: Record<Flow, string> = {
    login: "Sign in to continue your personalized learning path",
    register: "Create your account to start learning with clarity",
    "verify-otp": "We sent a verification code to your email",
    "forgot-password": "We'll send a reset code to your email",
    "reset-password": "Enter the code and choose a new password",
  };

  const showBackButton = flow !== "login" && flow !== "register";
  const backTarget: Partial<Record<Flow, Flow>> = {
    "verify-otp": "login",
    "forgot-password": "login",
    "reset-password": "forgot-password",
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 neural-pattern" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Quest<span className="gradient-text">ify</span></span>
          </Link>
          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight leading-tight">
                Learning that <span className="gradient-text">understands</span> you
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Questify analyzes how you learn, identifies your weak points, and adapts every exam, note, and study session to your unique needs.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { icon: CheckCircle, color: "success", title: "AI-Powered Diagnosis", desc: "Understand exactly what you don't know" },
                { icon: Sparkle, color: "primary", title: "Adaptive Learning", desc: "Content that evolves with your progress" },
                { icon: Shield, color: "secondary", title: "Private & Secure", desc: "Your learning data belongs only to you" },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-${color}/10 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 text-${color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground italic">"The only way to master something is to know exactly where you're weak."</p>
            <p className="text-xs text-muted-foreground/60">— The Philosophy Behind Questify</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="lg:hidden p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Quest<span className="gradient-text">ify</span></span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Back button */}
            {showBackButton && (
              <button onClick={() => setFlow(backTarget[flow] ?? "login")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            {/* Header */}
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{flowTitle[flow]}</h2>
              <p className="text-muted-foreground">{flowSubtitle[flow]}</p>
            </div>

            {/* Form */}
            {renderForm()}

            {/* Toggle login/register */}
            {(flow === "login" || flow === "register") && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground">
                      {flow === "register" ? "Already have an account?" : "New to Questify?"}
                    </span>
                  </div>
                </div>
                <Button type="button" variant="outline"
                  onClick={() => { setFlow(flow === "login" ? "register" : "login"); setPassword(""); setConfirmPassword(""); }}
                  className="w-full h-12 font-medium text-base border hover:bg-muted/50">
                  {flow === "login" ? "Create an account" : "Sign in instead"}
                </Button>
              </>
            )}

            <div className="lg:hidden flex items-center justify-center gap-2 pt-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Secure, private, and built for serious learners</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
