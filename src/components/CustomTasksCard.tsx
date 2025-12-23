import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Award } from "lucide-react";

interface CustomTask {
    id: string;
    title: string;
    description: string | null;
    track_type: string;
    xp_value: number;
    completed: boolean;
}

interface CustomTasksCardProps {
    tasks: CustomTask[];
    onUpdate: () => void;
}

export const CustomTasksCard = ({ tasks, onUpdate }: CustomTasksCardProps) => {
    const { toast } = useToast();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    if (tasks.length === 0) return null;

    const completedCount = tasks.filter((t) => t.completed).length;
    const progress = (completedCount / tasks.length) * 100;

    const handleToggleComplete = async (task: CustomTask) => {
        setUpdatingId(task.id);

        const newStatus = !task.completed;

        try {
            // 1. Update the custom task status
            const { error: taskError } = await supabase
                .from("custom_tasks" as any)
                .update({
                    completed: newStatus,
                    completed_at: newStatus ? new Date().toISOString() : null
                })
                .eq("id", task.id);

            if (taskError) throw taskError;

            // 2. Update user XP and create activity if completing
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch current XP
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("xp_total")
                    .eq("id", user.id)
                    .single();

                const xpChange = newStatus ? task.xp_value : -task.xp_value;

                // Update profile XP
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                        xp_total: Math.max(0, (profile?.xp_total || 0) + xpChange)
                    })
                    .eq("id", user.id);

                if (profileError) throw profileError;

                // Log activity if completing
                if (newStatus) {
                    await supabase.from("activities").insert({
                        user_id: user.id,
                        activity_type: "custom_task",
                        description: `أكملت مهمة مخصصة: ${task.title}`,
                        xp_earned: task.xp_value,
                        related_id: task.id
                    });
                }
            }

            toast({
                title: newStatus ? "تم إكمال المهمة! 🎉" : "تم إلغاء الإكمال",
                description: newStatus ? `حصلت على ${task.xp_value} XP` : "",
            });

            onUpdate();
        } catch (error: any) {
            toast({
                title: "حدث خطأ",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <Card className="border-none shadow-lg bg-gradient-to-br from-background to-muted/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <ListTodo className="h-5 w-5" />
                    المهام المخصصة
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span>التقدم الإجمالي</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-3">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${task.completed
                                ? "bg-success/5 border-success/20 opacity-80"
                                : "bg-background hover:border-primary/30 shadow-sm"
                                }`}
                        >
                            <Checkbox
                                checked={task.completed}
                                disabled={updatingId === task.id}
                                onCheckedChange={() => handleToggleComplete(task)}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className={`font-bold text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                        {task.title}
                                    </h4>
                                    <Badge variant="secondary" className="text-[10px] shrink-0">
                                        {task.xp_value} XP
                                    </Badge>
                                </div>
                                {task.description && (
                                    <p className={`text-xs mt-1 whitespace-pre-wrap ${task.completed ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                                        {task.description}
                                    </p>
                                )}
                                <div className="mt-2 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                    {task.track_type === 'data' ? 'تحليل البيانات' :
                                        task.track_type === 'english' ? 'اللغة الإنجليزية' :
                                            task.track_type === 'soft' ? 'المهارات الحياتية' : 'مهمة عامة'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
