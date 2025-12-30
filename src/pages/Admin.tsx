import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  UserCheck,
  UserX,
  FileCheck,
  BookOpen,
  ListTodo,
  UserPlus,
  MapPin,
  Camera
} from "lucide-react";
import { UserCustomLessons } from "@/components/admin/UserCustomLessons";
import { useNavigate } from "react-router-dom";
import { UserCustomTasks } from "@/components/admin/UserCustomTasks";
import { UserAvatarUpload } from "@/components/admin/UserAvatarUpload";
import { GlobalLessonDialog } from "@/components/admin/GlobalLessonDialog";
import { GlobalTaskDialog } from "@/components/admin/GlobalTaskDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  governorate?: string;
  membership_number?: string;
  created_at: string;
  xp_total?: number;
  overall_progress?: number;
  streak_days?: number;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
  english_level?: "A" | "B" | "C";
  status: "pending" | "approved" | "rejected";
  role: "learner" | "admin";
  join_date: string;
  email?: string;
  phone_number?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  track_type: string;
  xp: number;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
  published: boolean;
  created_at: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  track_type: string;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
  published: boolean;
  order_index: number;
}

interface Proof {
  id: string;
  user_id: string;
  task_id: string;
  submitted_at: string;
  completion_proof: string;
  status: string;
  task?: Task;
  user?: User;
}

// Helper Component for Pending User Row to manage local state
const PendingUserCard = ({ user, onApprove, onReject }: { user: User, onApprove: (id: string, general: string, english: string) => void, onReject: (id: string) => void }) => {
  const [generalLevel, setGeneralLevel] = useState<string>("Beginner");
  const [englishLevel, setEnglishLevel] = useState<string>("B");

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Avatar>
            <AvatarImage src={user.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-medium">{user.full_name}</h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              {user.governorate && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.governorate}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {user.email && <div>{user.email}</div>}
              تاريخ التسجيل: {user.created_at ? new Date(user.created_at).toLocaleDateString("ar-SA") : "-"}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            <div className="w-32">
              <label className="text-[10px] text-muted-foreground px-1">المستوى العام</label>
              <Select value={generalLevel} onValueChange={setGeneralLevel}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">مبتدئ</SelectItem>
                  <SelectItem value="Intermediate">متوسط</SelectItem>
                  <SelectItem value="Advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-[10px] text-muted-foreground px-1">اللغة</label>
              <Select value={englishLevel} onValueChange={setEnglishLevel}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">مستوى A</SelectItem>
                  <SelectItem value="B">مستوى B</SelectItem>
                  <SelectItem value="C">مستوى C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => onApprove(user.id, generalLevel, englishLevel)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              قبول
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(user.id)}
            >
              <UserX className="h-4 w-4 mr-2" />
              رفض
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalLearners: 0,
    avgProgress: 0,
    totalXP: 0,
    pendingTasks: 0,
    pendingUsers: 0,
  });
  const [learners, setLearners] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingProofs, setPendingProofs] = useState<Proof[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load approved users (learners and admins who want to test)
      const { data: learnersData } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "approved")
        .order("xp_total", { ascending: false });
      setLearners((learnersData as unknown as User[]) || []);

      // Load pending users
      const { data: pendingUsersData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "learner")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setPendingUsers((pendingUsersData as unknown as User[]) || []);

      // Load pending proofs
      const { data: proofsData } = await supabase
        .from("user_tasks")
        .select(`
          *,
          task:tasks(*),
          user:profiles(*)
        `)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });
      setPendingProofs((proofsData as unknown as Proof[]) || []);

      // Load lessons
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .order("order_index");
      setLessons((lessonsData as unknown as Lesson[]) || []);

      // Load tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      setTasks((tasksData as unknown as Task[]) || []);

      // Calculate stats
      const totalLearners = learnersData?.length || 0;
      const avgProgress = totalLearners > 0
        ? learnersData.reduce((sum, l) => sum + (l.overall_progress || 0), 0) / totalLearners
        : 0;
      const totalXP = learnersData?.reduce((sum, l) => sum + (l.xp_total || 0), 0) || 0;
      const pendingTasks = proofsData?.length || 0;
      const pendingUsersCount = pendingUsersData?.length || 0;

      setStats({
        totalLearners,
        avgProgress,
        totalXP,
        pendingTasks,
        pendingUsers: pendingUsersCount,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProof = async (userTaskId: string, xp: number, userId: string) => {
    try {
      // Update user_task
      await supabase
        .from("user_tasks")
        .update({
          status: "approved",
          xp_granted: xp,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", userTaskId);

      // Update user XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp_total")
        .eq("id", userId)
        .single();

      await supabase
        .from("profiles")
        .update({
          xp_total: (profile?.xp_total || 0) + xp,
        })
        .eq("id", userId);

      toast({
        title: "تم القبول ✅",
        description: `تم منح ${xp} XP للمستخدم`,
      });

      loadData();
    } catch (error) {
      console.error("Error approving proof:", error);
      toast({
        title: "حدث خطأ",
        variant: "destructive",
      });
    }
  };

  const handleRejectProof = async (userTaskId: string) => {
    try {
      await supabase
        .from("user_tasks")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", userTaskId);

      toast({
        title: "تم الرفض",
        variant: "destructive",
      });

      loadData();
    } catch (error) {
      console.error("Error rejecting proof:", error);
    }
    const handleLevelChange = async (userId: string, newLevel: "Beginner" | "Intermediate" | "Advanced") => {
      try {
        await supabase
          .from("profiles")
          .update({ level: newLevel })
          .eq("id", userId);

        toast({
          title: "تم التحديث ✅",
          description: `تم تغيير المستوى العام إلى ${newLevel}`,
        });

        loadData();
      } catch (error) {
        console.error("Error updating level:", error);
        toast({
          title: "حدث خطأ",
          variant: "destructive",
        });
      }
    };

    const handleEnglishLevelChange = async (userId: string, newLevel: "A" | "B" | "C") => {
      try {
        await supabase
          .from("profiles")
          .update({ english_level: newLevel })
          .eq("id", userId);

        toast({
          title: "تم التحديث ✅",
          description: `تم تغيير مستوى اللغة إلى ${newLevel}`,
        });

        loadData();
      } catch (error) {
        console.error("Error updating english level:", error);
        toast({
          title: "حدث خطأ",
          variant: "destructive",
        });
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "approved": return "bg-success text-white";
        case "submitted": return "bg-info text-white";
        case "rejected": return "bg-destructive text-white";
        default: return "bg-warning text-white";
      }
    };

    const getLevelColor = (level: string) => {
      switch (level) {
        case "Advanced": return "text-success";
        case "Intermediate": return "text-info";
        default: return "text-warning";
      }
    };

    const handleLessonLevelChange = async (lessonId: string, newLevel: "Beginner" | "Intermediate" | "Advanced" | null) => {
      try {
        await supabase
          .from("lessons")
          .update({ level: newLevel })
          .eq("id", lessonId);

        toast({
          title: "تم التحديث ✅",
          description: `تم تغيير مستوى الدرس`,
        });

        loadData();
      } catch (error) {
        console.error("Error updating lesson level:", error);
        toast({
          title: "حدث خطأ",
          variant: "destructive",
        });
      }
    };

    const handleTaskLevelChange = async (taskId: string, newLevel: "Beginner" | "Intermediate" | "Advanced" | null) => {
      try {
        await supabase
          .from("tasks")
          .update({ level: newLevel })
          .eq("id", taskId);

        toast({
          title: "تم التحديث ✅",
          description: `تم تغيير مستوى المهمة`,
        });

        loadData();
      } catch (error) {
        console.error("Error updating task level:", error);
        toast({
          title: "حدث خطأ",
          variant: "destructive",
        });
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

    const handleApproveUser = async (userId: string, generalLevel: string, englishLevel: string) => {
      try {
        await supabase
          .from("profiles")
          .update({
            status: "approved",
            level: generalLevel,
            english_level: englishLevel
          } as any)
          .eq("id", userId);

        toast({
          title: "تم قبول المستخدم ✅",
          description: `تم تفعيل الحساب وتحديد المستويات`,
        });

        loadData();
      } catch (error) {
        console.error("Error approving user:", error);
        toast({
          title: "حدث خطأ",
          variant: "destructive",
        });
      }
    };

    const handleRejectUser = async (userId: string) => {
      try {
        await supabase
          .from("profiles")
          .update({ status: "rejected" })
          .eq("id", userId);

        toast({
          title: "تم رفض المستخدم",
          variant: "destructive",
        });

        loadData();
      } catch (error) {
        console.error("Error rejecting user:", error);
        toast({
          title: "حدث خطأ",
          variant: "destructive",
        });
      }
    };



    if (loading) {
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navbar />

        <div className="container py-8 space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-secondary to-primary p-8 text-white shadow-2xl">
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">
                لوحة الإدارة 🎯
              </h1>
              <p className="text-white/90 text-lg">
                متابعة شاملة لتقدم جميع المتعلمين
              </p>
            </div>
            <div className="absolute left-0 top-0 h-full w-1/3 bg-white/10 blur-3xl"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المتعلمين</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.totalLearners}</div>
                <p className="text-xs text-muted-foreground mt-1">متعلم</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">متوسط التقدم</CardTitle>
                <TrendingUp className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">
                  {Math.round(stats.avgProgress)}%
                </div>
                <Progress value={stats.avgProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي XP المكتسب</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.totalXP}</div>
                <p className="text-xs text-muted-foreground mt-1">نقطة</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">قيد المراجعة</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">مهمة</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending-users" className="space-y-4">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="pending-users">
                <UserPlus className="h-4 w-4 ml-1" />
                طلبات الانضمام
                {stats.pendingUsers > 0 && (
                  <Badge variant="destructive" className="mr-2">
                    {stats.pendingUsers}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="learners">المتعلمين</TabsTrigger>
              <TabsTrigger value="proofs">
                مراجعة الإثباتات
                {stats.pendingTasks > 0 && (
                  <Badge variant="destructive" className="mr-2">
                    {stats.pendingTasks}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="lessons">
                <BookOpen className="h-4 w-4 ml-1" />
                الدروس
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <ListTodo className="h-4 w-4 ml-1" />
                المهام
              </TabsTrigger>
            </TabsList>

            {/* Pending Users Tab */}
            <TabsContent value="pending-users" className="space-y-4">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>طلبات الانضمام المعلقة</CardTitle>
                  <CardDescription>
                    مراجعة وقبول أو رفض طلبات التسجيل الجديدة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        لا توجد طلبات معلقة
                      </h3>
                      <p className="text-muted-foreground">
                        تمت مراجعة جميع طلبات الانضمام
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingUsers.map((user) => (
                        <div key={user.id} className="mb-4">
                          <PendingUserCard
                            user={user}
                            onApprove={handleApproveUser}
                            onReject={handleRejectUser}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learners" className="space-y-4">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>قائمة المتعلمين</CardTitle>
                  <CardDescription>
                    متابعة تفصيلية لجميع المتعلمين ومستوياتهم
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المتعلم</TableHead>
                        <TableHead>المستوى</TableHead>
                        <TableHead>التقدم العام</TableHead>
                        <TableHead>النقاط</TableHead>
                        <TableHead>أيام متتالية</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {learners.map((learner) => (
                        <TableRow key={learner.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatarUpload
                                userId={learner.id}
                                userName={learner.full_name}
                                currentAvatarUrl={learner.avatar_url}
                                onAvatarUpdated={loadData}
                              />
                              <div>
                                <div className="font-medium">{learner.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {learner.email && <div className="text-xs font-medium text-primary">{learner.email}</div>}
                                  {learner.phone_number && <div className="text-xs font-medium text-secondary">{learner.phone_number}</div>}
                                  انضم {new Date(learner.join_date).toLocaleDateString("ar-SA")}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Select
                                value={learner.level || "Beginner"}
                                onValueChange={(value: "Beginner" | "Intermediate" | "Advanced") => handleLevelChange(learner.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Beginner">عام: مبتدئ</SelectItem>
                                  <SelectItem value="Intermediate">عام: متوسط</SelectItem>
                                  <SelectItem value="Advanced">عام: متقدم</SelectItem>
                                </SelectContent>
                              </Select>

                              <Select
                                value={learner.english_level || "B"}
                                onValueChange={(value: "A" | "B" | "C") => handleEnglishLevelChange(learner.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A">إنجليزي: A</SelectItem>
                                  <SelectItem value="B">إنجليزي: B</SelectItem>
                                  <SelectItem value="C">إنجليزي: C</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {Math.round(learner.overall_progress || 0)}%
                              </div>
                              <Progress value={learner.overall_progress || 0} className="h-2 w-20" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-primary">
                              {learner.xp_total || 0} XP
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              🔥 {learner.streak_days || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserCustomTasks
                                userId={learner.id}
                                userName={learner.full_name}
                                onUpdate={loadData}
                              />
                              <UserCustomLessons
                                userId={learner.id}
                                userName={learner.full_name}
                                onUpdate={loadData}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/profile?userId=${learner.id}`)}
                              >
                                <Eye className="h-4 w-4 ml-2" />
                                عرض الملف
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent >

            <TabsContent value="proofs" className="space-y-4">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>الإثباتات المعلقة</CardTitle>
                  <CardDescription>
                    راجع وقبل أو ارفض الإثباتات المقدمة من المتعلمين
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingProofs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        لا توجد إثباتات معلقة
                      </h3>
                      <p className="text-muted-foreground">
                        جميع الإثباتات تمت مراجعتها
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingProofs.map((proof) => (
                        <div
                          key={proof.id}
                          className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Avatar>
                                <AvatarImage src={proof.user?.avatar_url} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {proof.user?.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium">{proof.task?.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  بواسطة: {proof.user?.full_name}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="outline">
                                    {proof.task?.xp} XP
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    تم التقديم: {new Date(proof.submitted_at).toLocaleDateString("ar-SA")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveProof(proof.id, proof.task?.xp || 0, proof.user_id)}
                                className="gap-2"
                              >
                                <UserCheck className="h-4 w-4" />
                                قبول
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectProof(proof.id)}
                                className="gap-2"
                              >
                                <UserX className="h-4 w-4" />
                                رفض
                              </Button>
                            </div>
                          </div>
                          {proof.completion_proof && (
                            <div className="bg-muted p-3 rounded">
                              <p className="text-sm font-medium mb-1">الإثبات:</p>
                              <p className="text-sm text-muted-foreground break-all">
                                {proof.completion_proof}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>إدارة المنهج الدراسي</CardTitle>
                    <CardDescription>
                      تحديث الدروس الحالية أو إضافة دروس جديدة للمسارات الأساسية
                    </CardDescription>
                  </div>
                  <GlobalLessonDialog onLessonAdded={loadData} />
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الدرس</TableHead>
                        <TableHead>المسار</TableHead>
                        <TableHead>المستوى</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lessons.map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{lesson.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {lesson.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTrackLabel(lesson.track_type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={lesson.level || "all"}
                              onValueChange={(value) => handleLessonLevelChange(lesson.id, value === "all" ? null : value as "Beginner" | "Intermediate" | "Advanced")}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="Beginner">مبتدئ</SelectItem>
                                <SelectItem value="Intermediate">متوسط</SelectItem>
                                <SelectItem value="Advanced">متقدم</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge className={lesson.published ? "bg-success text-white" : "bg-muted"}>
                              {lesson.published ? "منشور" : "مخفي"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>إدارة المهام</CardTitle>
                    <CardDescription>
                      تحديث المهام الحالية أو إضافة مهام جديدة للمسارات الأساسية
                    </CardDescription>
                  </div>
                  <GlobalTaskDialog onTaskAdded={loadData} />
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المهمة</TableHead>
                        <TableHead>المسار</TableHead>
                        <TableHead>XP</TableHead>
                        <TableHead>المستوى</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {task.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTrackLabel(task.track_type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-primary">{task.xp} XP</span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={task.level || "all"}
                              onValueChange={(value) => handleTaskLevelChange(task.id, value === "all" ? null : value as "Beginner" | "Intermediate" | "Advanced")}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="Beginner">مبتدئ</SelectItem>
                                <SelectItem value="Intermediate">متوسط</SelectItem>
                                <SelectItem value="Advanced">متقدم</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge className={task.published ? "bg-success text-white" : "bg-muted"}>
                              {task.published ? "منشور" : "مخفي"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs >
        </div >
      </div >
    );
  };




  export default Admin;