import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Calendar, Award, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { taskProofSchema, validateOrThrow } from "@/lib/validations";

interface Task {
  id: string;
  title: string;
  description: string;
  track_type: string;
  xp: number;
  deadline: string | null;
  resource_link: string | null;
}

interface UserTask {
  id: string;
  status: string;
  completion_proof: string | null;
  proof_type: string | null;
  submitted_at: string | null;
  rejection_reason: string | null;
}

export default function TaskDetails() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [userTask, setUserTask] = useState<UserTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completionProof, setCompletionProof] = useState("");
  const [proofType, setProofType] = useState<"link" | "text" | "file">("text");

  useEffect(() => {
    loadTaskDetails();
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load task details
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;
      setTask(taskData);

      // Load user task submission if exists
      const { data: userTaskData } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("task_id", taskId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (userTaskData) {
        setUserTask(userTaskData);
        setCompletionProof(userTaskData.completion_proof || "");
        setProofType(userTaskData.proof_type || "text");
      }
    } catch (error) {
      console.error("Error loading task:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل تفاصيل المهمة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    let validProof: string;
    try {
      validProof = validateOrThrow(taskProofSchema, completionProof);
    } catch (error: any) {
      toast({
        title: "تنبيه",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (userTask) {
        // Update existing submission
        const { error } = await supabase
          .from("user_tasks")
          .update({
            completion_proof: validProof,
            proof_type: proofType,
            status: "submitted",
            submitted_at: new Date().toISOString(),
          })
          .eq("id", userTask.id);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase
          .from("user_tasks")
          .insert({
            task_id: taskId,
            user_id: user.id,
            completion_proof: validProof,
            proof_type: proofType,
            status: "submitted",
            submitted_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast({
        title: "تم بنجاح",
        description: "تم إرسال المهمة للمراجعة",
      });

      await loadTaskDetails();
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إرسال المهمة",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "مقبول";
      case "rejected":
        return "مرفوض";
      case "submitted":
        return "قيد المراجعة";
      default:
        return "معلق";
    }
  };

  const getTrackLabel = (track: string) => {
    switch (track) {
      case "data":
        return "تحليل البيانات";
      case "english":
        return "اللغة الإنجليزية";
      case "soft":
        return "المهارات الحياتية";
      default:
        return track;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>المهمة غير موجودة</CardTitle>
              <CardDescription>لم يتم العثور على المهمة المطلوبة</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard")}>العودة للوحة التحكم</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const canSubmit = !userTask || userTask.status === "rejected";
  const isApproved = userTask?.status === "approved";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            ← العودة
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getTrackLabel(task.track_type)}</Badge>
                    {userTask && (
                      <Badge className={getStatusColor(userTask.status)}>
                        {getStatusLabel(userTask.status)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Award className="h-5 w-5" />
                  <span className="text-lg font-bold">{task.xp} XP</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {task.deadline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>الموعد النهائي: {format(new Date(task.deadline), "dd/MM/yyyy")}</span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-2">الوصف</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
              </div>

              {task.resource_link && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">المصادر</h3>
                  <a
                    href={task.resource_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    فتح الرابط
                  </a>
                </div>
              )}

              {userTask?.rejection_reason && (
                <Card className="bg-destructive/10 border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">سبب الرفض</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-destructive">{userTask.rejection_reason}</p>
                  </CardContent>
                </Card>
              )}

              {!isApproved && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">إثبات الإكمال</h3>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={proofType === "text" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProofType("text")}
                      disabled={!!userTask && userTask.status === "submitted"}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      نص
                    </Button>
                    <Button
                      variant={proofType === "link" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProofType("link")}
                      disabled={!!userTask && userTask.status === "submitted"}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      رابط
                    </Button>
                  </div>

                  <Textarea
                    placeholder={proofType === "link" ? "أدخل رابط العمل المكتمل" : "اكتب وصف عملك هنا"}
                    value={completionProof}
                    onChange={(e) => setCompletionProof(e.target.value)}
                    rows={6}
                    disabled={userTask?.status === "submitted"}
                  />

                  {canSubmit && (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {userTask ? "إعادة الإرسال" : "إرسال المهمة"}
                        </>
                      )}
                    </Button>
                  )}

                  {userTask?.status === "submitted" && (
                    <p className="text-center text-muted-foreground">
                      المهمة قيد المراجعة من قبل المشرف
                    </p>
                  )}
                </div>
              )}

              {isApproved && (
                <Card className="bg-green-500/10 border-green-500">
                  <CardContent className="pt-6">
                    <p className="text-center text-green-700 dark:text-green-400 font-semibold">
                      تم قبول المهمة وحصلت على {task.xp} XP! 🎉
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
