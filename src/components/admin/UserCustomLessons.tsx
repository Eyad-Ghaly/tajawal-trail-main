import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, BookOpen, CheckCircle2, Image } from "lucide-react";

interface CustomLesson {
  id: string;
  title: string;
  description: string | null;
  video_link: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface UserCustomLessonsProps {
  userId: string;
  userName: string;
  onUpdate?: () => void;
}

export const UserCustomLessons = ({ userId, userName, onUpdate }: UserCustomLessonsProps) => {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<CustomLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    video_link: "",
    track_type: "data",
  });

  useEffect(() => {
    if (open) {
      loadLessons();
    }
  }, [open, userId]);

  const loadLessons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_lessons")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) {
      setLessons(data || []);
    }
    setLoading(false);
  };

  const handleAddLesson = async () => {
    if (!newLesson.title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان الدرس",
        variant: "destructive",
      });
      return;
    }

    if (newLesson.track_type === "custom" && !newLesson.description.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة اسم المسار الخاص في حقل الوصف",
        variant: "destructive",
      });
      return;
    }

    const finalTrackType = newLesson.track_type === "custom" ? newLesson.description.trim() : newLesson.track_type;

    const { error } = await supabase.from("custom_lessons").insert({
      user_id: userId,
      title: newLesson.title,
      description: newLesson.description || null,
      video_link: newLesson.video_link || null,
      track_type: finalTrackType,
    });

    if (error) {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم إضافة الدرس",
        description: "تم إضافة الدرس المخصص للمستخدم بنجاح",
      });
      loadLessons();
      if (onUpdate) onUpdate();
      setNewLesson({ title: "", description: "", video_link: "", track_type: "data" });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const { error } = await supabase
      .from("custom_lessons")
      .delete()
      .eq("id", lessonId);

    if (error) {
      toast({
        title: "حدث خطأ",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم حذف الدرس",
        description: "تم حذف الدرس بنجاح",
      });
      loadLessons();
      if (onUpdate) onUpdate();
    }
  };

  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          دروس مخصصة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>الدروس المخصصة - {userName}</DialogTitle>
          <DialogDescription>
            إدارة الدروس المخصصة لهذا المتعلم
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        {lessons.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>تقدم الدروس المخصصة</span>
              <span className="font-medium">
                {completedCount} / {lessons.length} ({Math.round(progress)}%)
              </span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Add New Lesson Form */}
        <div className="border rounded-lg p-4 space-y-3">
          <h4 className="font-medium">إضافة درس جديد</h4>
          <Input
            placeholder="عنوان الدرس *"
            value={newLesson.title}
            onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
          />
          <Textarea
            placeholder="وصف الدرس (اختياري)"
            value={newLesson.description}
            onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
          />
          <Input
            placeholder="رابط الفيديو (اختياري)"
            value={newLesson.video_link}
            onChange={(e) => setNewLesson({ ...newLesson, video_link: e.target.value })}
          />
          <Select
            value={newLesson.track_type}
            onValueChange={(value) => {
              setNewLesson({ ...newLesson, track_type: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المسار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data">تحليل البيانات</SelectItem>
              <SelectItem value="english">اللغة الإنجليزية</SelectItem>
              <SelectItem value="soft">المهارات الحياتية</SelectItem>
              <SelectItem value="custom">مسار خاص</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleAddLesson} className="gap-2 w-full">
            <Plus className="h-4 w-4" />
            إضافة الدرس
          </Button>
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          <h4 className="font-medium">الدروس الحالية ({lessons.length})</h4>
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          ) : lessons.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              لا توجد دروس مخصصة لهذا المتعلم
            </p>
          ) : (
            lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="border rounded-lg p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{lesson.title}</h5>
                    {lesson.completed && (
                      <Badge className="bg-success text-white gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        مكتمل
                      </Badge>
                    )}
                  </div>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {lesson.description}
                    </p>
                  )}
                  {lesson.video_link && (
                    <a
                      href={lesson.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 block"
                    >
                      رابط الفيديو
                    </a>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteLesson(lesson.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
