import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Crown,
  Sparkle,
  Lightning,
  ArrowLeft,
  Shield,
  Star,
  Infinity,
  Brain,
  BookOpen,
  ChartBar,
  FileText,
  Headphones,
  Users,
  ArrowSquareOut,
  Clock,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { subscriptionService, type Plan, type Subscription } from "@/services/subscriptionService";
import { paymentService, type Transaction } from "@/services/paymentService";

const PLAN_ICONS: Record<string, React.ElementType> = {
  Free: Lightning,
  Pro: Crown,
  Premium: Crown,
  Team: Users,
};

const PLAN_COLORS: Record<string, string> = {
  Free: "from-slate-500 to-gray-500",
  Pro: "from-primary to-secondary",
  Premium: "from-primary to-secondary",
  Team: "from-accent to-teal-400",
};

function getFeatureLabel(key: string, value: Record<string, unknown>): string {
  const labels: Record<string, (v: Record<string, unknown>) => string> = {
    material_limit: (v) => `Up to ${v.limit} materials`,
    ai_requests_per_day: (v) => `${v.limit} AI requests/day`,
    exam_generation_enabled: (v) => v.enabled ? "Exam generation" : "",
    chat_enabled: (v) => v.enabled ? "AI Chat (Questy)" : "",
    note_methods_enabled: (v) => Array.isArray(v.methods) ? `Note methods: ${(v.methods as string[]).join(", ")}` : "Note taking",
    max_file_size_mb: (v) => `Max file size: ${v.limit}MB`,
  };
  const fn = labels[key];
  if (!fn) return key.replace(/_/g, " ");
  return fn(value);
}

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Medical Student",
    content: "Questify Pro helped me score 95% on my anatomy finals. The deep weak point analysis is a game-changer!",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Computer Science Major",
    content: "The AI-powered study techniques saved me hours of ineffective studying. Worth every penny!",
    avatar: "MJ",
  },
];

export default function Billing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [initiating, setInitiating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      subscriptionService.getPlans().catch(() => [] as Plan[]),
      subscriptionService.getActiveSubscription().catch(() => null),
      paymentService.getHistory().catch(() => [] as Transaction[]),
    ]).then(([p, sub, tx]) => {
      setPlans(p);
      setActiveSub(sub);
      setTransactions(tx);
      setLoadingPlans(false);
    });
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    if (plan.price === 0) {
      toast.info("You are already on the Free plan");
      return;
    }
    if (activeSub?.plan_id === plan.plan_id) {
      toast.info("You are already subscribed to this plan");
      return;
    }
    setInitiating(plan.plan_id);
    try {
      const result = await paymentService.initiate(plan.plan_id);
      // Open Telebirr payment URL in new tab
      window.open(result.pay_url, "_blank", "noopener,noreferrer");
      toast.success("Redirecting to Telebirr payment...", {
        description: "Complete your payment in the new tab. Your subscription will activate automatically.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
    } finally {
      setInitiating(null);
    }
  };

  return (
    <DashboardLayout title="Billing & Plans">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Choose Your Learning Path</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock your full potential with Questify. Get unlimited exams, advanced AI insights, and personalized study plans.
          </p>
          {activeSub && (
            <Badge className="mt-4 bg-success/20 text-success border-success/30">
              Active subscription — expires {new Date(activeSub.expires_at).toLocaleDateString()}
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        {loadingPlans ? (
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-64" />
              </Card>
            ))}
          </div>
        ) : (
          <div className={cn("grid gap-6 mb-16", plans.length === 1 ? "md:grid-cols-1 max-w-sm mx-auto" : plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
            {plans.map((plan, idx) => {
              const Icon = PLAN_ICONS[plan.name] ?? Crown;
              const color = PLAN_COLORS[plan.name] ?? "from-primary to-secondary";
              const isPopular = idx === 1 && plans.length >= 2;
              const isCurrent = activeSub?.plan_id === plan.plan_id;
              const isFree = plan.price === 0;

              return (
                <Card
                  key={plan.plan_id}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:-translate-y-2",
                    isPopular && "border-primary shadow-xl shadow-primary/10 scale-105"
                  )}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0">
                      <div className="gradient-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute top-0 left-0">
                      <div className="bg-success text-white text-xs font-bold px-4 py-1.5 rounded-br-xl">
                        CURRENT PLAN
                      </div>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br", color)}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">
                          {isFree ? "Free" : `${plan.price.toFixed(2)} ETB`}
                        </span>
                        {!isFree && (
                          <span className="text-muted-foreground">/{plan.billing_cycle === "monthly" ? "mo" : "yr"}</span>
                        )}
                      </div>
                      {plan.trial_days > 0 && (
                        <p className="text-sm text-success mt-1">{plan.trial_days}-day free trial</p>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((f) => {
                        const label = getFeatureLabel(f.feature_key, f.feature_value);
                        if (!label) return null;
                        return (
                          <li key={f.feature_id} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-success" />
                            </div>
                            <span className="text-sm capitalize">{label}</span>
                          </li>
                        );
                      })}
                    </ul>

                    <Button
                      className={cn("w-full", isPopular ? "gradient-primary" : "")}
                      variant={isPopular ? "default" : "outline"}
                      size="lg"
                      disabled={isCurrent || isFree || initiating === plan.plan_id}
                      onClick={() => handleUpgrade(plan)}
                    >
                      {initiating === plan.plan_id ? (
                        <>
                          <div className="w-4 h-4 border border-current/30 border-t-current rounded-full animate-spin mr-2" />
                          Initiating...
                        </>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : isFree ? (
                        "Free Plan"
                      ) : (
                        <>
                          Pay with Telebirr
                          <ArrowSquareOut className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Payment History */}
        {transactions.length > 0 && (
          <Card className="mb-16">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.transaction_id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{tx.provider_reference || tx.transaction_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{tx.amount} {tx.currency}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          tx.status === "completed" && "border-success text-success",
                          tx.status === "pending" && "border-warning text-warning",
                          tx.status === "failed" && "border-destructive text-destructive"
                        )}
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Comparison */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Why Upgrade?</CardTitle>
            <CardDescription className="text-center">
              Powerful features that help students achieve their goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Infinity, title: "Unlimited Exams", description: "Take as many practice exams as you need." },
                { icon: Brain, title: "Deep AI Analysis", description: "Comprehensive weak point analysis with explanations." },
                { icon: BookOpen, title: "All Study Techniques", description: "Access all AI-powered study methods: Pomodoro, Feynman, and more." },
                { icon: ChartBar, title: "Advanced Analytics", description: "Track your progress with detailed charts and performance insights." },
                { icon: FileText, title: "Exam History", description: "Review past exams, analyze mistakes, and re-take to improve." },
                { icon: Headphones, title: "Priority Support", description: "Get fast, dedicated support whenever you need help." },
              ].map((feature, index) => (
                <div key={index} className="p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Loved by Students</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-lg mb-4">{testimonial.content}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 p-12 rounded-3xl gradient-primary text-white">
          <Sparkle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join thousands of students who are already achieving their academic goals with Questify.
          </p>
          {plans.find((p) => p.price > 0) && (
            <Button
              size="lg"
              variant="secondary"
              className="text-primary font-semibold"
              onClick={() => {
                const paid = plans.find((p) => p.price > 0);
                if (paid) handleUpgrade(paid);
              }}
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
