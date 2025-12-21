import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database, BookOpen, Code, ArrowRight, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type TrackType = "data" | "english" | "soft" | "custom";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_link: string | null;
  duration_minutes: number | null;
  track_type: string;
  order_index: number | null;
}

interface UserLesson {
  lesson_id: string;
  watched: boolean;
}

const LearningPath = () => {
  const { trackType } = useParams<{ trackType: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userLessons, setUserLessons] = useState<UserLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const getTrackInfo = () => {
    switch (trackType) {
      case "data":
        return {
          title: "مسار تحليل البيانات",
          icon: <Database className="h-6 w-6" />,
          color: "from-blue-500 to-cyan-500"
        };
      case "english":
        return {
          title: "مسار اللغة الإنجليزية",
          icon: <BookOpen className="h-6 w-6" />,
          color: "from-green-500 to-emerald-500"
        };
      case "soft":
        return {
          title: "مسار المهارات الحياتية",
          icon: <Code className="h-6 w-6" />,
          color: "from-purple-500 to-pink-500"
        };
      case "custom":
        return {
          title: "مسار التعلم المخصص",
          icon: <BookOpen className="h-6 w-6" />,
          color: "from-amber-500 to-orange-500"
        };
      default:
        return {
          title: "مسار التعلم",
          icon: <BookOpen className="h-6 w-6" />,
          color: "from-gray-500 to-gray-600"
        };
    }
  };

  useEffect(() => {
    loadLessons();
  }, [trackType]);

  const loadLessons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load lessons for this track
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("track_type", trackType as any)
        .eq("published", true)
        .order("order_index", { ascending: true });

      if (lessonsError) throw lessonsError;

      // Load user progress
      const { data: userLessonsData, error: userLessonsError } = await supabase
        .from("user_lessons")
        .select("lesson_id, watched")
        .eq("user_id", user.id);

      if (userLessonsError) throw userLessonsError;

      setLessons(lessonsData || []);
      setUserLessons(userLessonsData || []);
    } catch (error: any) {
      console.error("Error loading lessons:", error);
      toast.error(`حدث خطأ في تحميل الدروس: ${error.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && lessons.length > 0) {
      const params = new URLSearchParams(location.search);
      const lessonId = params.get("lessonId");
      if (lessonId) {
        const element = document.getElementById(`lesson-${lessonId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [loading, lessons, location.search]);

  const handleCheckboxChange = async (lessonId: string, checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userLesson = userLessons.find(ul => ul.lesson_id === lessonId);

      if (userLesson) {
        // Update existing record
        const { error } = await supabase
          .from("user_lessons")
          .update({
            watched: checked,
            watched_at: checked ? new Date().toISOString() : null
          })
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("user_lessons")
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            watched: checked,
            watched_at: checked ? new Date().toISOString() : null
          });

        if (error) throw error;
      }

      // Update local state
      setUserLessons(prev => {
        const exists = prev.find(ul => ul.lesson_id === lessonId);
        if (exists) {
          return prev.map(ul =>
            ul.lesson_id === lessonId ? { ...ul, watched: checked } : ul
          );
        }
        return [...prev, { lesson_id: lessonId, watched: checked }];
      });

      toast.success(checked ? "تم تعليم الدرس كمكتمل" : "تم إلغاء التعليم");
    } catch (error: any) {
      console.error("Error updating lesson:", error);
      toast.error(`حدث خطأ في تحديث الدرس: ${error.message || ""}`);
    }
  };

  const isLessonWatched = (lessonId: string) => {
    return userLessons.find(ul => ul.lesson_id === lessonId)?.watched || false;
  };

  const completedCount = lessons.filter(l => isLessonWatched(l.id)).length;
  const progressPercentage = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  const trackInfo = getTrackInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للوحة التحكم
          </Button>

          <Card className={`border-none shadow-lg bg-gradient-to-r ${trackInfo.color}`}>
            <CardHeader className="text-white">
              <div className="flex items-center gap-3 mb-2">
                {trackInfo.icon}
                <CardTitle className="text-2xl">{trackInfo.title}</CardTitle>
              </div>
              <CardDescription className="text-white/90">
                أكمل جميع الدروس لإتقان هذا المسار
              </CardDescription>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-white/90">
                  <span>{completedCount} من {lessons.length} دروس مكتملة</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="bg-white/20" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد دروس متاحة في هذا المسار حالياً</p>
              </CardContent>
            </Card>
          ) : (
            lessons.map((lesson, index) => {
              const isWatched = isLessonWatched(lesson.id);
              return (
                <Card
                  key={lesson.id}
                  id={`lesson-${lesson.id}`}
                  className={`border-none shadow-lg transition-all ${isWatched ? 'bg-muted/50' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="mt-1">
                        <Checkbox
                          checked={isWatched}
                          onCheckedChange={(checked) => handleCheckboxChange(lesson.id, checked as boolean)}
                          className="h-5 w-5"
                        />
                      </div>

                      {/* Lesson Number Badge */}
                      <div className="flex-shrink-0">
                        <Badge
                          variant={isWatched ? "default" : "outline"}
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                        >
                          {isWatched ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </Badge>
                      </div>

                      {/* Lesson Content */}
                      <div className="flex-1 space-y-2">
                        <h3 className={`text-lg font-semibold ${isWatched ? 'line-through text-muted-foreground' : ''}`}>
                          {lesson.title}
                        </h3>

                        {lesson.description && (
                          <p className="text-sm text-muted-foreground">
                            {lesson.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {lesson.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{lesson.duration_minutes} دقيقة</span>
                            </div>
                          )}
                        </div>

                        {/* Video Link */}
                        {lesson.video_link && (
                          <Button
                            variant={isWatched ? "outline" : "default"}
                            size="sm"
                            className="mt-2"
                            onClick={() => window.open(lesson.video_link!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 ml-2" />
                            شاهد الدرس
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
