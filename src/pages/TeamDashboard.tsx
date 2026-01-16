import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Check, Trophy, Target, Star, Shield, Loader2, UserPlus, UserCheck, UserX, BookOpen, ListTodo, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalLessonDialog } from "@/components/admin/GlobalLessonDialog";
import { GlobalTaskDialog } from "@/components/admin/GlobalTaskDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TeamDashboard = () => {
    const [team, setTeam] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);
    const [teamLessons, setTeamLessons] = useState<any[]>([]);
    const [teamTasks, setTeamTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadTeamData();
    }, []);

    const loadTeamData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Team
            const { data: teamData, error: teamError } = await supabase
                .from("teams")
                .select("*")
                .eq("leader_id", user.id)
                .single();

            if (teamError && teamError.code !== 'PGRST116') {
                console.error("Error fetching team:", teamError);
            }

            setTeam(teamData);

            if (teamData) {
                // Fetch Approved Members
                let membersQuery: any = (supabase.from("profiles") as any)
                    .select("*")
                    .eq("team_id", teamData.id)
                    .eq("status", "approved")
                    .order("xp_total", { ascending: false });
                const { data: membersData } = await membersQuery;
                setMembers(membersData || []);

                // Fetch Pending Members (NEW)
                let pendingQuery: any = (supabase.from("profiles") as any)
                    .select("*")
                    .eq("team_id", teamData.id)
                    .eq("status", "pending")
                    .order("created_at", { ascending: false });
                const { data: pendingData } = await pendingQuery;
                setPendingMembers(pendingData || []);

                // Fetch Team Lessons (NEW)
                let lessonsQuery: any = (supabase.from("lessons") as any)
                    .select("*")
                    .eq("team_id", teamData.id)
                    .order("created_at", { ascending: false });
                const { data: lessonsData } = await lessonsQuery;
                setTeamLessons(lessonsData || []);

                // Fetch Team Tasks (NEW)
                let tasksQuery: any = (supabase.from("tasks") as any)
                    .select("*")
                    .eq("team_id", teamData.id)
                    .order("created_at", { ascending: false });
                const { data: tasksData } = await tasksQuery;
                setTeamTasks(tasksData || []);
            }

        } catch (error) {
            console.error("Error loading team data:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (team?.code) {
            navigator.clipboard.writeText(team.code);
            setCopied(true);
            toast({
                title: "تم نسخ الكود",
                description: "يمكنك مشاركة هذا الكود مع أعضاء فريقك",
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleApproveMember = async (userId: string) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ status: 'approved', level: 'Intermediate', english_level: 'B' }) // Default levels
                .eq("id", userId);

            if (error) throw error;

            toast({ title: "تم قبول العضو بنجاح" });
            loadTeamData();
        } catch (error) {
            console.error(error);
            toast({ title: "حدث خطأ", variant: "destructive" });
        }
    };

    const handleRejectMember = async (userId: string) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ status: 'rejected' })
                .eq("id", userId);

            if (error) throw error;

            toast({ title: "تم رفض العضو" });
            loadTeamData();
        } catch (error) {
            console.error(error);
            toast({ title: "حدث خطأ", variant: "destructive" });
        }
    };


    const getTrackLabel = (type: string) => {
        switch (type) {
            case 'technical': return 'المسار التقني';
            case 'english': return 'اللغة الإنجليزية';
            case 'soft-skills': return 'Soft skills';
            default: return type;
        }
    };

    const handleLevelChange = async (userId: string, level: string) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ level } as any)
                .eq("id", userId);
            if (error) throw error;
            toast({ title: "تم تحديث المستوى" });
            loadTeamData();
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ في التحديث", variant: "destructive" });
        }
    };

    const handleEnglishLevelChange = async (userId: string, english_level: string) => {
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ english_level } as any)
                .eq("id", userId);
            if (error) throw error;
            toast({ title: "تم تحديث مستوى الإنجليزية" });
            loadTeamData();
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ في التحديث", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <Navbar />

            <div className="container py-8 space-y-8">
                {!team ? (
                    <Card className="text-center p-8">
                        <CardHeader>
                            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <CardTitle>لا يوجد فريق مسجل</CardTitle>
                            <CardDescription>
                                يبدو أنك لم تقم بإنشاء فريق بعد، أو حدث خطأ ما. يرجى التواصل مع الدعم.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <>
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-primary">
                                    {team.name}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    لوحة تحكم الفريق ومتابعة الأعضاء
                                </p>
                            </div>

                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground font-medium mb-1">كود الفريق</p>
                                        <code className="bg-background px-3 py-1 rounded border font-mono text-lg font-bold tracking-wider">
                                            {team.code}
                                        </code>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={copyCode}>
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Stats Overview */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">عدد الأعضاء</CardTitle>
                                    <Users className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{members.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">طلبات الانضمام</CardTitle>
                                    <UserPlus className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{pendingMembers.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">مجموع نقاط الفريق</CardTitle>
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {members.reduce((sum, m) => sum + (m.xp_total || 0), 0)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">متوسط التقدم</CardTitle>
                                    <Target className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {members.length > 0
                                            ? Math.round(members.reduce((sum, m) => sum + (m.overall_progress || 0), 0) / members.length)
                                            : 0}%
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="members" className="space-y-4">
                            <TabsList className="grid w-full max-w-2xl grid-cols-4">
                                <TabsTrigger value="members">الأعضاء</TabsTrigger>
                                <TabsTrigger value="pending">
                                    الطلبات
                                    {pendingMembers.length > 0 && (
                                        <Badge variant="destructive" className="mr-2 text-xs py-0 px-1">{pendingMembers.length}</Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="lessons">الدروس</TabsTrigger>
                                <TabsTrigger value="tasks">المهام</TabsTrigger>
                            </TabsList>

                            {/* MEMBERS TAB */}
                            <TabsContent value="members">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>أعضاء الفريق</CardTitle>
                                        <CardDescription>قائمة بجميع الأعضاء ومستوياتهم الحالية</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>الاسم</TableHead>
                                                    <TableHead>المستوى</TableHead>
                                                    <TableHead>التقدم العام</TableHead>
                                                    <TableHead>النقاط (XP)</TableHead>
                                                    <TableHead>نقاط الشارة</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {members.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                            لا يوجد أعضاء في الفريق حتى الآن. شارك الكود لتبدأ!
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    members.map((member) => (
                                                        <TableRow key={member.id}>
                                                            <TableCell className="font-medium flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={member.avatar_url} />
                                                                    <AvatarFallback>{member.full_name?.[0]}</AvatarFallback>
                                                                </Avatar>
                                                                {member.role === 'team_leader' && <Shield className="w-3 h-3 text-purple-500" />}
                                                                {member.full_name}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-2">
                                                                    <Select
                                                                        value={member.level || "Beginner"}
                                                                        onValueChange={(value) => handleLevelChange(member.id, value)}
                                                                    >
                                                                        <SelectTrigger className="w-28 h-8">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Beginner">مبتدئ</SelectItem>
                                                                            <SelectItem value="Intermediate">متوسط</SelectItem>
                                                                            <SelectItem value="Advanced">متقدم</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>

                                                                    <Select
                                                                        value={member.english_level || "B"}
                                                                        onValueChange={(value) => handleEnglishLevelChange(member.id, value)}
                                                                    >
                                                                        <SelectTrigger className="w-28 h-8">
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
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-full bg-secondary/20 rounded-full h-2 w-24">
                                                                        <div
                                                                            className="bg-secondary h-2 rounded-full"
                                                                            style={{ width: `${member.overall_progress || 0}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground">{Math.round(member.overall_progress || 0)}%</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-bold font-mono text-primary">
                                                                {member.xp_total || 0}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1 text-yellow-500">
                                                                    <Star className="w-3 h-3 fill-current" />
                                                                    {member.streak_days || 0}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* PENDING REQUESTS TAB */}
                            <TabsContent value="pending">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>طلبات الانضمام {pendingMembers.length > 0 && `(${pendingMembers.length})`}</CardTitle>
                                        <CardDescription>وافق على الأعضاء الجدد الذين استخدموا كود فريقك</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {pendingMembers.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">
                                                لا توجد طلبات انضمام معلقة حالياً
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {pendingMembers.map((user) => (
                                                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar>
                                                                <AvatarImage src={user.avatar_url} />
                                                                <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{user.full_name}</div>
                                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                                                <div className="text-xs text-muted-foreground mt-1">تاريخ الطلب: {new Date(user.created_at).toLocaleDateString("ar-EG")}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveMember(user.id)}>
                                                                <UserCheck className="w-4 h-4 mr-1" /> قبول
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleRejectMember(user.id)}>
                                                                <UserX className="w-4 h-4 mr-1" /> رفض
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* LESSONS TAB */}
                            <TabsContent value="lessons">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>محتوى الفريق التعليمي</CardTitle>
                                            <CardDescription>الدروس الخاصة التي قمت بإنشائها لفريقك فقط</CardDescription>
                                        </div>
                                        <GlobalLessonDialog onLessonAdded={loadTeamData} teamId={team.id} />
                                    </CardHeader>
                                    <CardContent>
                                        {teamLessons.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">
                                                لم تقم بإضافة دروس خاصة لفريقك بعد
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>عنوان الدرس</TableHead>
                                                        <TableHead>المسار</TableHead>
                                                        <TableHead>تاريخ الإضافة</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {teamLessons.map((lesson) => (
                                                        <TableRow key={lesson.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <BookOpen className="w-4 h-4 text-primary" />
                                                                    {lesson.title}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{getTrackLabel(lesson.track_type)}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {new Date(lesson.created_at).toLocaleDateString("ar-EG")}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* TASKS TAB */}
                            <TabsContent value="tasks">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>مهام الفريق</CardTitle>
                                            <CardDescription>المهام والتكليفات الخاصة بفريقك</CardDescription>
                                        </div>
                                        <GlobalTaskDialog onTaskAdded={loadTeamData} teamId={team.id} />
                                    </CardHeader>
                                    <CardContent>
                                        {teamTasks.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">
                                                لم تقم بإضافة مهام خاصة لفريقك بعد
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>عنوان المهمة</TableHead>
                                                        <TableHead>المسار</TableHead>
                                                        <TableHead>XP</TableHead>
                                                        <TableHead>تاريخ الإضافة</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {teamTasks.map((task) => (
                                                        <TableRow key={task.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <ListTodo className="w-4 h-4 text-purple-500" />
                                                                    {task.title}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{getTrackLabel(task.track_type)}</Badge>
                                                            </TableCell>
                                                            <TableCell className="font-bold text-success">
                                                                {task.xp} XP
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {new Date(task.created_at).toLocaleDateString("ar-EG")}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        </div>
    );
};

export default TeamDashboard;
