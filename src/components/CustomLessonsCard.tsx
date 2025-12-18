import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ExternalLink } from "lucide-react";

interface CustomLesson {
  id: string;
  title: string;
  description: string | null;
  video_link: string | null;
  completed: boolean;
}

interface CustomLessonsCardProps {
  lessons: CustomLesson[];
  onUpdate: () => void;
}

export const CustomLessonsCard = ({ lessons, onUpdate }: CustomLessonsCardProps) => {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (lessons.length === 0) return null;

  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = (completedCount / lessons.length) * 100;

  const handleToggleComplete = async (lessonId: string, currentStatus: boolean) => {
    setUpdatingId(lessonId);

    const { error } = await supabase
      .from("custom_lessons")
      .update({
        completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null
      })
      .eq("id", lessonId);

    if (error) {
      toast({
        title: "حدث خطأ",
        variant: "destructive",
      });
    } else {
      toast({
        title: !currentStatus ? "تم إكمال الدرس ✅" : "تم إلغاء الإكمال",
      });
      onUpdate();
    }
    setUpdatingId(null);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-warning" />
          الدروس المخصصة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {Object.entries(
          lessons.reduce((acc: any, lesson: any) => {
            const track = (lesson as any).track_type || 'custom';
            if (!acc[track]) acc[track] = [];
            acc[track].push(lesson);
            return acc;
          }, {})
        ).map(([trackName, trackLessons]: [string, any]) => {
          const trackCompleted = trackLessons.filter((l: any) => l.completed).length;
          const trackTotal = trackLessons.length;
          const trackProgress = (trackCompleted / trackTotal) * 100;

          return (
            <div key={trackName} className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {trackName === 'data' ? 'تحليل البيانات (مخصص)' :
                    trackName === 'english' ? 'اللغة الإنجليزية (مخصص)' :
                      trackName === 'soft' ? 'المهارات الحياتية (مخصص)' :
                        trackName}
                </h3>
                <span className="text-xs font-medium px-2 py-1 bg-muted rounded">
                  {trackCompleted}/{trackTotal} دروس
                </span>
              </div>

              {/* Progress for this group */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span>تقدم المسار</span>
                  <span>{Math.round(trackProgress)}%</span>
                </div>
                <Progress value={trackProgress} className="h-1.5" />
              </div>

              {/* Lessons List in this Group */}
              <div className="space-y-3">
                {trackLessons.map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${lesson.completed ? "bg-success/5 border-success/20 opacity-80" : "hover:bg-muted/50 shadow-sm"
                      }`}
                  >
                    <Checkbox
                      checked={lesson.completed}
                      disabled={updatingId === lesson.id}
                      onCheckedChange={() => handleToggleComplete(lesson.id, lesson.completed)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${lesson.completed ? "line-through text-muted-foreground" : ""}`}>
                        {lesson.title}
                      </h4>
                      {lesson.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {lesson.description}
                        </p>
                      )}
                      {lesson.video_link && (
                        <a
                          href={lesson.video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          مشاهدة المحتوى
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
