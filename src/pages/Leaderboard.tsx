import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Flame, Star, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
    id: string;
    full_name: string;
    avatar_url: string | null;
    overall_progress: number;
    streak_days: number;
    xp_total: number;
    rank?: number;
}

const Leaderboard = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url, overall_progress, streak_days, xp_total")
                .neq("role", "admin")
                .order("overall_progress", { ascending: false })
                .order("xp_total", { ascending: false })
                .order("streak_days", { ascending: false })
                .limit(50);

            if (error) throw error;

            // Assign ranks handling ties if needed, currently just index based
            const rankedUsers = data.map((user, index) => ({
                ...user,
                rank: index + 1,
            }));

            setUsers(rankedUsers);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const TopThree = ({ users }: { users: LeaderboardUser[] }) => {
        if (users.length === 0) return null;

        // Reorder for display: 2nd, 1st, 3rd
        const displayOrder = [users[1], users[0], users[2]].filter(Boolean);

        return (
            <div className="flex justify-center items-end gap-4 mb-12 mt-8">
                {displayOrder.map((user) => {
                    if (!user) return null;
                    const isFirst = user.rank === 1;
                    const isSecond = user.rank === 2;
                    const isThird = user.rank === 3;

                    return (
                        <div
                            key={user.id}
                            className={cn(
                                "relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105",
                                isFirst ? "bg-gradient-to-t from-yellow-100 to-yellow-50 border-4 border-yellow-400 w-48 z-10 -mt-8 shadow-xl" :
                                    isSecond ? "bg-gradient-to-t from-gray-100 to-gray-50 border-4 border-gray-300 w-40 shadow-lg" :
                                        "bg-gradient-to-t from-orange-100 to-orange-50 border-4 border-orange-300 w-40 shadow-lg"
                            )}
                        >
                            {isFirst && <Trophy className="w-12 h-12 text-yellow-500 mb-2 animate-bounce" />}
                            {isSecond && <Medal className="w-10 h-10 text-gray-400 mb-2" />}
                            {isThird && <Medal className="w-10 h-10 text-orange-400 mb-2" />}

                            <div className={cn(
                                "relative rounded-full border-4 overflow-hidden mb-3",
                                isFirst ? "w-24 h-24 border-yellow-400" : "w-16 h-16 border-gray-300"
                            )}>
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                                    <AvatarFallback className="text-xl font-bold">
                                        {user.full_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={cn(
                                    "absolute bottom-0 w-full text-center text-xs font-bold py-1 text-white",
                                    isFirst ? "bg-yellow-500" : isSecond ? "bg-gray-400" : "bg-orange-400"
                                )}>
                                    #{user.rank}
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-center truncate w-full mb-1">{user.full_name}</h3>

                            <div className="flex flex-col w-full gap-2 mt-2 text-sm">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> التقدم</span>
                                    <span className="font-bold text-primary">{user.overall_progress}%</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> XP</span>
                                    <span className="font-bold text-yellow-600">{user.xp_total}</span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> تتابع</span>
                                    <span className="font-bold text-orange-500">{user.streak_days} يوم</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            <div className="container pt-8 pb-4">
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-4xl font-black text-primary tracking-tight">لوحة الشرف 🏆</h1>
                    <p className="text-muted-foreground text-lg">أفضل المتعلمين والمنافسين لهذا الأسبوع</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        <TopThree users={users} />

                        <Card className="max-w-4xl mx-auto shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    قائمة المتصدرين
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {users.slice(3).map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex-none w-8 text-center font-bold text-muted-foreground">
                                                #{user.rank}
                                            </div>

                                            <Avatar className="w-10 h-10 border-2 border-primary/10">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate">{user.full_name}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Flame className="w-3 h-3 text-orange-500" />
                                                        {user.streak_days} يوم
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-yellow-500" />
                                                        {user.xp_total} XP
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-none w-32 md:w-48">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">التقدم العام</span>
                                                    <span className="font-bold">{user.overall_progress}%</span>
                                                </div>
                                                <Progress value={user.overall_progress} className="h-2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {users.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        لا يوجد متعلمين حتى الآن
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
