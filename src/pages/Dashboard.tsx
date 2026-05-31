import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Sparkle, Flame, Target, BookOpen, ArrowRight,
  Brain, Biohazard, Clock, Users, Medal, ChartLine,
  ChartBar, ChartPie, Calendar, Target as TargetIcon,
  TrendUp, ClockClockwise, BookmarkSimple, Lightning, CaretDown,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar
} from 'recharts';

// =================== MOCK DATA GENERATORS ===================
const generatePerformanceData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    mastery: 70 + Math.random() * 25,
    focus: 40 + Math.random() * 40,
    retention: 75 + Math.random() * 20,
    speed: 60 + Math.random() * 30,
  }));
};

const generateSubjectData = () => {
  const subjects = ['Algorithms', 'Neural Networks', 'Data Structures', 'Statistics', 'Calculus', 'ML Ops'];
  return subjects.map(subject => ({
    subject,
    proficiency: Math.floor(60 + Math.random() * 40),
    timeSpent: Math.floor(5 + Math.random() * 20),
    completion: Math.floor(50 + Math.random() * 50),
    growth: Math.floor(-10 + Math.random() * 30),
  }));
};

const generateCognitiveMetrics = () => {
  return [
    { metric: 'Working Memory', value: 85, fullMark: 100 },
    { metric: 'Processing Speed', value: 72, fullMark: 100 },
    { metric: 'Pattern Recognition', value: 91, fullMark: 100 },
    { metric: 'Logical Reasoning', value: 78, fullMark: 100 },
    { metric: 'Spatial Awareness', value: 67, fullMark: 100 },
    { metric: 'Verbal Comprehension', value: 82, fullMark: 100 },
  ];
};

const generateDailyProgress = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    engagement: Math.floor(20 + Math.sin(i / 24 * Math.PI * 2) * 30 + Math.random() * 20),
    focus: Math.floor(30 + Math.cos(i / 24 * Math.PI) * 25 + Math.random() * 15),
  }));
};

const generateLearningPathData = () => {
  return [
    { name: 'Beginner', value: 25, color: '#3b82f6' },
    { name: 'Intermediate', value: 45, color: '#8b5cf6' },
    { name: 'Advanced', value: 20, color: '#10b981' },
    { name: 'Expert', value: 10, color: '#f59e0b' },
  ];
};

const generateActivityData = () => {
  const activities = [
    { type: 'Video Lecture', duration: 45, timestamp: '2 hours ago', score: 92 },
    { type: 'Interactive Quiz', duration: 15, timestamp: '3 hours ago', score: 88 },
    { type: 'Coding Challenge', duration: 60, timestamp: '5 hours ago', score: 95 },
    { type: 'Reading Material', duration: 30, timestamp: '1 day ago', score: 85 },
    { type: 'Practice Exam', duration: 90, timestamp: '2 days ago', score: 90 },
  ];
  return activities;
};

// =================== COMPONENTS ===================
const FocusCard = ({ title, subtitle, action, imageGradient, onClick, disabled = false }: any) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl md:rounded-3xl border bg-card p-6 md:p-8 group cursor-pointer transition-all duration-300 hover:shadow-xl",
      disabled ? "opacity-60 cursor-not-allowed" : "hover:border-primary/50 hover:-translate-y-1"
    )}
    onClick={!disabled ? onClick : undefined}
  >
    <div className={cn("absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity", imageGradient)} />
    <div className="relative z-10 flex flex-col h-full justify-between gap-6 md:gap-8">
      <div className="space-y-3 md:space-y-4">
        <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 text-primary font-bold text-[10px] md:text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
        {action} <ArrowRight className="transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  </div>
);

const WeekOverview = () => {
  const weekData = [
    { day: 'Mon', focus: 85, learning: 70 },
    { day: 'Tue', focus: 60, learning: 65 },
    { day: 'Wed', focus: 40, learning: 80 },
    { day: 'Thu', focus: 75, learning: 85 },
    { day: 'Fri', focus: 90, learning: 60 },
    { day: 'Sat', focus: 50, learning: 75 },
    { day: 'Sun', focus: 0, learning: 0 },
  ];

  return (
    <Card className="border rounded-2xl">
      <CardHeader className="p-5 md:p-6">
        <CardTitle className="text-lg font-bold">Week Overview</CardTitle>
        <CardDescription className="text-xs">Daily focus vs learning efficiency</CardDescription>
      </CardHeader>
      <CardContent className="p-5 md:p-6 pt-0">
        <div className="space-y-5 md:space-y-6">
          {weekData.map((day, index) => (
            <div key={index} className="space-y-1.5 md:space-y-2">
              <div className="flex justify-between text-[11px] md:text-sm">
                <span className="font-bold">{day.day}</span>
                <span className="text-muted-foreground font-medium">
                  {day.focus}% / {day.learning}%
                </span>
              </div>
              <div className="flex gap-1.5 md:gap-2">
                <div className="flex-1 h-1.5 md:h-2 bg-primary/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${day.focus}%` }}
                  />
                </div>
                <div className="flex-1 h-1.5 md:h-2 bg-green-500/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${day.learning}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// =================== MAIN DASHBOARD COMPONENT ===================
export default function Dashboard() {
  const [performanceData, setPerformanceData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [cognitiveData, setCognitiveData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [learningPathData, setLearningPathData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = () => {
      setPerformanceData(generatePerformanceData());
      setSubjectData(generateSubjectData());
      setCognitiveData(generateCognitiveMetrics());
      setDailyData(generateDailyProgress());
      setLearningPathData(generateLearningPathData());
      setActivities(generateActivityData());
      setLoading(false);
    };

    loadData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleStartSession = (type: string) => {
    switch (type) {
      case 'study': navigate('/upload'); break;
      case 'challenge': navigate('/study-room'); break;
      case 'review': navigate('/notes'); break;
      case 'exam': navigate('/exam'); break;
      default: break;
    }
  };

  return (
    <DashboardLayout title="">
      <div className="max-w-7xl mx-auto pb-10 md:pb-20 space-y-6 md:space-y-8 px-1">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Learner'}.
              </h1>
              <Badge variant="outline" className="text-[10px] md:text-xs px-2 md:py-1 rounded-full border-primary/20 bg-primary/5 text-primary">
                <Sparkle className="w-3 h-3 mr-1" weight="fill" />
                AI-Enhanced
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground opacity-80">{user?.email}</p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <FocusCard
            title="Deep Study"
            subtitle="Enter flow state with adaptive learning"
            action="Begin Session"
            imageGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
            onClick={() => handleStartSession('study')}
          />
          <FocusCard
            title="AI Challenge"
            subtitle="Test against AI-generated problems"
            action="Start Challenge"
            imageGradient="bg-gradient-to-br from-purple-500 to-pink-500"
            onClick={() => handleStartSession('challenge')}
          />
          <FocusCard
            title="Review Session"
            subtitle="Target weak areas with spaced repetition"
            action="Review Now"
            imageGradient="bg-gradient-to-br from-green-500 to-emerald-500"
            onClick={() => handleStartSession('review')}
          />
          <FocusCard
            title="Simulation Exam"
            subtitle="Full-length adaptive assessment"
            action="Take Exam"
            imageGradient="bg-gradient-to-br from-orange-500 to-red-500"
            onClick={() => handleStartSession('exam')}
          />
        </div>

        {/* Bottom Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WeekOverview />

          <Card className="border rounded-2xl lg:col-span-2">
            <CardHeader className="p-5 md:p-6">
              <CardTitle className="text-lg font-bold">Learning Recommendations</CardTitle>
              <CardDescription className="text-xs">AI-powered suggestions based on your performance</CardDescription>
            </CardHeader>
            <CardContent className="p-5 md:p-6 pt-0">
              <div className="space-y-4">
                {subjectData.slice(0, 3).map((subject, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all gap-4">
                    <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-background border shadow-sm flex items-center justify-center font-black text-primary shrink-0">
                        {subject.subject.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm md:text-base truncate">{subject.subject}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
                            <TargetIcon className="w-3 h-3" />
                            {subject.proficiency}% Proficiency
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {subject.timeSpent}h spent
                          </div>
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] md:text-xs font-bold",
                            subject.growth >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            <TrendUp className={cn("w-3 h-3", subject.growth < 0 && "rotate-180")} />
                            {subject.growth >= 0 ? '+' : ''}{subject.growth}% growth
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button variant="secondary" size="sm" className="flex-1 sm:flex-none h-8 md:h-9 text-[10px] md:text-xs font-bold rounded-lg px-4">
                        <BookOpen className="w-3.5 h-3.5 mr-2" />
                        Study
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-8 md:h-9 text-[10px] md:text-xs font-bold rounded-lg px-4">
                        <TargetIcon className="w-3.5 h-3.5 mr-2" />
                        Practice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
