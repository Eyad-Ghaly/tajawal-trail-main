import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CustomLessonsCard } from "@/components/CustomLessonsCard";
import { CustomTasksCard } from "@/components/CustomTasksCard";
import {
  TrendingUp,
  Target,
  Flame,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Brain,
  Globe,
  Users,
  ArrowLeft
} from "lucide-react";
import { formatDistance } from "date-fns";
import { ar } from "date-fns/locale";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [customTasks, setCustomTasks] = useState<any[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getLocalDate();

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // Load all published lessons for progress calculation
      const { data: allLessons } = await supabase
        .from("lessons")
        .select("id, track_type, team_id") // Query matches usage
        .eq("published", true);

      // Load all completed user lessons
      const { data: allUserLessons } = await supabase
        .from("user_lessons")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("watched", true);

      // Calculate progress per track
      const tracks = ["data", "english", "soft"];
      const progressStats: Record<string, number> = {};

      tracks.forEach(track => {
        // Safe cast for filtering
        const trackLessons = (allLessons as any[])?.filter(l =>
          l.track_type === track &&
          ((profileData as any)?.team_id ? l.team_id === (profileData as any)?.team_id : true)
        ) || [];

        const totalLessons = trackLessons.length;

        if (totalLessons === 0) {
          progressStats[`${track}_progress`] = 0;
        } else {
          const completedLessons = allUserLessons?.filter(ul =>
            trackLessons.some(tl => tl.id === ul.lesson_id)
          ).length || 0;
          progressStats[`${track}_progress`] = (completedLessons / totalLessons) * 100;
        }
      });
      // ... (Lines 96-199 retained implicitly, but I need to be careful with range. I will just update the Lessons Query block below)

      // Load lessons - show newest first for suggestions
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*, team_id") // Fetch team_id
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(20);

      // Filter lessons based on user level AND Team
      const filteredLessons = (lessonsData as any[])?.filter((lesson: any) => {
        // Team Check
        if ((profileData as any)?.team_id && lesson.team_id !== (profileData as any)?.team_id) return false;

        // Show lessons that match user level, or if user level is not set, show beginner/all lessons
        const userLevel = (profileData as any)?.level || "Beginner";
        return !lesson.level || lesson.level === userLevel;
      }).slice(0, 4) || [];
      setLessons(filteredLessons);

      // Load custom lessons for this user
      const { data: customLessonsData } = await supabase
        .from("custom_lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCustomLessons(customLessonsData || []);

      // Load custom tasks
      const { data: customTasksData } = await supabase
        .from("custom_tasks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCustomTasks((customTasksData as any) || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyCheckin = async (trackType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localDate = getLocalDate();

      // Enhanced logging
      console.log('🔍 Check-in Debug Info:', {
        localDate,
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        browserTime: new Date().toLocaleString(),
        utcTime: new Date().toISOString(),
        userId: user.id
      });

      // Use RPC for atomic check-in (prevents race conditions and duplicate XP)
      // Use RPC for atomic check-in (prevents race conditions and duplicate XP)
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('perform_daily_checkin', {
        uid: user.id,
        target_track: trackType,
        checkin_date: localDate
      });

      console.log('📡 RPC Response:', { rpcData, rpcError });

      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
        throw rpcError;
      }

      const result = rpcData as { success: boolean, message: string };

      if (!result.success) {
        console.warn('⚠️ Check-in failed:', result.message);
        toast({
          title: "تنبيه",
          description: result.message || "لقد سجلت حضورك اليوم بالفعل",
          variant: "destructive",
        });
        return;
      }


      toast({
        title: "تم التسجيل بنجاح!",
        description: "حصلت على 5 نقاط خبرة (XP) إضافية لمتابعة تعلمك اليوم.",
      });

      // Reload data to reflect changes
      loadData();
    } catch (error) {
      console.error("Error with daily checkin:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const getTrackIcon = (trackType: string) => {
    switch (trackType) {
      case "data": return <Brain className="h-5 w-5" />;
      case "english": return <Globe className="h-5 w-5" />;
      case "soft": return <Users className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getTrackLabel = (trackType: string) => {
    switch (trackType) {
      case "data": return "تحليل البيانات";
      case "english": return "اللغة الإنجليزية";
      case "soft": return "المهارات الحياتية";
      default: return trackType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success text-white";
      case "submitted": return "bg-info text-white";
      case "rejected": return "bg-destructive text-white";
      case "new": return "bg-primary text-white";
      default: return "bg-warning text-white";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "مقبول";
      case "submitted": return "قيد المراجعة";
      case "rejected": return "مرفوض";
      case "new": return "جديد";
      default: return "معلق";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-24 bg-muted rounded-lg"></div>
              <div className="h-24 bg-muted rounded-lg"></div>
              <div className="h-24 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />

      <div className="container py-8 space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-secondary p-8 text-white shadow-2xl">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              مرحباً، {profile?.full_name}! 👋
            </h1>
            <p className="text-white/90 text-lg">
              لنواصل رحلة التطوير معاً
            </p>
          </div>
          <div className="absolute left-0 top-0 h-full w-1/3 bg-white/10 blur-3xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي النقاط</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{profile?.xp_total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">XP</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">التقدم العام</CardTitle>
              <Target className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {Math.round(profile?.overall_progress || 0)}%
              </div>
              <Progress value={profile?.overall_progress || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">أيام متتالية</CardTitle>
              <Flame className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{profile?.streak_days || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">يوم</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المستوى</CardTitle>
              <Award className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{profile?.level || "Beginner"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bars */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>تقدمك في المسارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-medium">تحليل البيانات</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(profile?.data_progress || 0)}%
                </span>
              </div>
              <Progress value={profile?.data_progress || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-secondary" />
                  <span className="font-medium">اللغة الإنجليزية</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(profile?.english_progress || 0)}%
                </span>
              </div>
              <Progress value={profile?.english_progress || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-success" />
                  <span className="font-medium">المهارات الحياتية</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round(profile?.soft_progress || 0)}%
                </span>
              </div>
              <Progress value={profile?.soft_progress || 0} className="h-2" />
            </div>

            {/* Custom Lessons Progress grouped by track */}
            {Object.entries(
              customLessons.reduce((acc: any, lesson: any) => {
                const track = lesson.track_type || 'custom';
                if (!acc[track]) acc[track] = [];
                acc[track].push(lesson);
                return acc;
              }, {})
            ).map(([trackName, trackLessons]: [string, any]) => {
              const trackCompleted = trackLessons.filter((l: any) => l.completed).length;
              const trackTotal = trackLessons.length;
              const trackProgress = (trackCompleted / trackTotal) * 100;

              // Skip if it's one of the main tracks already shown
              if (['data', 'english', 'soft'].includes(trackName)) return null;

              return (
                <div key={trackName} className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-warning" />
                      <span className="font-medium">
                        {trackName === 'custom' ? 'دروس مخصصة إضافية' : trackName}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {trackCompleted} / {trackTotal}
                      {" "}({Math.round(trackProgress)}%)
                    </span>
                  </div>
                  <Progress
                    value={trackProgress}
                    className="h-2"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Daily Check-in */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle>التسجيل اليومي السريع ⚡</CardTitle>
            <CardDescription>احصل على 5 XP لكل مسار يومياً!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                variant="outline"
                className={`h-20 flex-col gap-2 relative ${todayCheckin?.data_task
                  ? "border-success bg-success/10"
                  : "hover:border-primary hover:bg-primary/5"
                  }`}
                onClick={() => handleDailyCheckin("data")}
                disabled={!!todayCheckin?.data_task}
              >
                {todayCheckin?.data_task && (
                  <CheckCircle2 className="h-5 w-5 text-success absolute top-2 right-2" />
                )}
                <Brain className="h-6 w-6 text-primary" />
                <span>تحليل البيانات</span>
              </Button>
              <Button
                variant="outline"
                className={`h-20 flex-col gap-2 relative ${todayCheckin?.lang_task
                  ? "border-success bg-success/10"
                  : "hover:border-secondary hover:bg-secondary/5"
                  }`}
                onClick={() => handleDailyCheckin("lang")}
                disabled={!!todayCheckin?.lang_task}
              >
                {todayCheckin?.lang_task && (
                  <CheckCircle2 className="h-5 w-5 text-success absolute top-2 right-2" />
                )}
                <Globe className="h-6 w-6 text-secondary" />
                <span>اللغة الإنجليزية</span>
              </Button>
              <Button
                variant="outline"
                className={`h-20 flex-col gap-2 relative ${todayCheckin?.soft_task
                  ? "border-success bg-success/10"
                  : "hover:border-success hover:bg-success/5"
                  }`}
                onClick={() => handleDailyCheckin("soft")}
                disabled={!!todayCheckin?.soft_task}
              >
                {todayCheckin?.soft_task && (
                  <CheckCircle2 className="h-5 w-5 text-success absolute top-2 right-2" />
                )}
                <Users className="h-6 w-6 text-success" />
                <span>الورد اليومي</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tasks */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                مهامي الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد مهام بعد
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/task/${task.task?.id}`)}
                    >
                      <div className="mt-1">
                        {getTrackIcon(task.task?.track_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium leading-tight">
                            {task.task?.title}
                          </h4>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getTrackLabel(task.task?.track_type)} • {task.task?.xp} XP
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                دروس مقترحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lessons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد دروس متاحة
                  </p>
                ) : (
                  lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-1">
                        {getTrackIcon(lesson.track_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium leading-tight">{lesson.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lesson.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {lesson.duration_minutes} دقيقة
                          </div>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/learning-path/${lesson.track_type}`)}
                          >
                            ابدأ الآن
                            <ArrowLeft className="h-4 w-4 mr-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Content */}
        <div className="space-y-6">
          <CustomTasksCard tasks={customTasks} onUpdate={loadData} />
          <CustomLessonsCard lessons={customLessons} onUpdate={loadData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;