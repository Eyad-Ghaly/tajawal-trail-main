import { useState, useEffect } from "react";
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
import { Plus, Trash2, ListTodo, CheckCircle2 } from "lucide-react";

interface CustomTask {
    id: string;
    title: string;
    description: string | null;
    track_type: string;
    xp_value: number;
    completed: boolean;
    completed_at: string | null;
    created_at: string;
}

interface UserCustomTasksProps {
    userId: string;
    userName: string;
    onUpdate?: () => void;
}

export const UserCustomTasks = ({ userId, userName, onUpdate }: UserCustomTasksProps) => {
    const { toast } = useToast();
    const [tasks, setTasks] = useState<CustomTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        track_type: "data",
        xp_value: 10,
    });

    useEffect(() => {
        if (open) {
            loadTasks();
        }
    }, [open, userId]);

    const loadTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("custom_tasks" as any)
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (!error) {
            setTasks((data as any) || []);
        }
        setLoading(false);
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            toast({
                title: "خطأ",
                description: "يرجى إدخال عنوان المهمة",
                variant: "destructive",
            });
            return;
        }

        const { error } = await supabase.from("custom_tasks" as any).insert({
            user_id: userId,
            title: newTask.title,
            description: newTask.description || null,
            track_type: newTask.track_type,
            xp_value: newTask.xp_value,
        });

        if (error) {
            toast({
                title: "حدث خطأ",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "تم إضافة المهمة",
                description: "تم إضافة المهمة المخصصة للمستخدم بنجاح",
            });
            setNewTask({ title: "", description: "", track_type: "data", xp_value: 10 });
            loadTasks();
            if (onUpdate) onUpdate();
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const { error } = await supabase
            .from("custom_tasks" as any)
            .delete()
            .eq("id", taskId);

        if (error) {
            toast({
                title: "حدث خطأ",
                variant: "destructive",
            });
        } else {
            toast({
                title: "تم حذف المهمة",
                description: "تم حذف المهمة بنجاح",
            });
            loadTasks();
            if (onUpdate) onUpdate();
        }
    };

    const completedCount = tasks.filter((t) => t.completed).length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <ListTodo className="h-4 w-4" />
                    مهام مخصصة
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>المهام المخصصة - {userName}</DialogTitle>
                    <DialogDescription>
                        إدارة المهام المخصصة لهذا المتعلم
                    </DialogDescription>
                </DialogHeader>

                {/* Progress */}
                {tasks.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>تقدم المهام المخصصة</span>
                            <span className="font-medium">
                                {completedCount} / {tasks.length} ({Math.round(progress)}%)
                            </span>
                        </div>
                        <Progress value={progress} />
                    </div>
                )}

                {/* Add New Task Form */}
                <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">إضافة مهمة جديدة</h4>
                    <Input
                        placeholder="عنوان المهمة *"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                    <Textarea
                        placeholder="وصف المهمة (اختياري)"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium px-1">المسار</label>
                            <Select
                                value={newTask.track_type}
                                onValueChange={(value) => {
                                    setNewTask({ ...newTask, track_type: value });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر المسار" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="data">تحليل البيانات</SelectItem>
                                    <SelectItem value="english">اللغة الإنجليزية</SelectItem>
                                    <SelectItem value="soft">المهارات الحياتية</SelectItem>
                                    <SelectItem value="custom">مهمة عامة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium px-1">نقاط الخبرة (XP)</label>
                            <Input
                                type="number"
                                placeholder="XP"
                                value={newTask.xp_value}
                                onChange={(e) => setNewTask({ ...newTask, xp_value: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <Button onClick={handleAddTask} className="gap-2 w-full mt-2">
                        <Plus className="h-4 w-4" />
                        إضافة المهمة
                    </Button>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                    <h4 className="font-medium">المهام الحالية ({tasks.length})</h4>
                    {loading ? (
                        <div className="animate-pulse space-y-2">
                            <div className="h-16 bg-muted rounded"></div>
                            <div className="h-16 bg-muted rounded"></div>
                        </div>
                    ) : tasks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-6">
                            لا توجد مهام مخصصة لهذا المتعلم
                        </p>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className="border rounded-lg p-3 flex items-start justify-between gap-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-medium">{task.title}</h5>
                                        {task.completed && (
                                            <Badge className="bg-success text-white gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                مكتمل
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[10px]">
                                            {task.xp_value} XP
                                        </Badge>
                                    </div>
                                    {task.description && (
                                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                            {task.description}
                                        </p>
                                    )}
                                    <div className="text-[10px] text-muted-foreground mt-2">
                                        المسار: {task.track_type === 'data' ? 'تحليل البيانات' :
                                            task.track_type === 'english' ? 'اللغة الإنجليزية' :
                                                task.track_type === 'soft' ? 'المهارات الحياتية' : 'عام'}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteTask(task.id)}
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
