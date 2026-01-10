import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Check, Trophy, Target, Star, Shield, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TeamDashboard = () => {
    const [team, setTeam] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
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
                // Fetch Members
                const { data: membersData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("team_id", teamData.id)
                    .order("xp_total", { ascending: false }); // Leaderboard style

                setMembers(membersData || []);
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
                        <div className="grid gap-4 md:grid-cols-3">
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

                        {/* Members Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>أعضاء الفريق</CardTitle>
                                <CardDescription>
                                    قائمة بجميع الأعضاء ومستوياتهم الحالية
                                </CardDescription>
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
                                                        {member.role === 'team_leader' && <Shield className="w-3 h-3 text-purple-500" />}
                                                        {member.full_name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{member.level || "Beginner"}</Badge>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default TeamDashboard;
