import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
import { Plus, ClipboardList } from "lucide-react";

interface GlobalTaskDialogProps {
    onTaskAdded: () => void;
}

export const GlobalTaskDialog = ({ onTaskAdded }: GlobalTaskDialogProps) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        resource_link: "",
        track_type: "data",
        level: "all",
        english_level: "B",
        xp: 10,
    });

    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            toast({
                title: "خطأ",
                description: "يرجى إدخال عنوان المهمة",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.from("tasks").insert({
            title: newTask.title,
            description: newTask.description || null,
            resource_link: newTask.resource_link || null,
            track_type: newTask.track_type,
            level: newTask.track_type === 'english' ? null : (newTask.level === "all" ? null : newTask.level),
            english_level: newTask.track_type === 'english' ? newTask.english_level : null,
            xp: newTask.xp,
            published: true,
        } as any);

        if (error) {
            toast({
                title: "حدث خطأ",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "تم إضافة المهمة بنجاح ✅",
            });
            setNewTask({
                title: "",
                description: "",
                resource_link: "",
                track_type: "data",
                level: "all",
                english_level: "B",
                xp: 10,
            });
            setOpen(false);
            onTaskAdded();
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-white">
                    <Plus className="h-4 w-4" />
                    إضافة مهمة جديدة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>إضافة مهمة للمنهج الأساسي</DialogTitle>
                    <DialogDescription>
                        قم بإضافة مهمة جديدة سيتم توزيعها على جميع الطلاب في المستوى المختار.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">عنوان المهمة *</label>
                        <Input
                            placeholder="مثال: تحليل بيانات المبيعات"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">الوصف</label>
                        <Textarea
                            placeholder="شرح ماذا يجب على الطالب فعله..."
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">المسار</label>
                            <Select
                                value={newTask.track_type}
                                onValueChange={(val) => setNewTask({ ...newTask, track_type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="data">تحليل البيانات</SelectItem>
                                    <SelectItem value="english">اللغة الإنجليزية</SelectItem>
                                    <SelectItem value="soft">المهارات الحياتية</SelectItem>
                                    <SelectItem value="custom">مسار خاص</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            {newTask.track_type === 'english' ? (
                                <>
                                    <label className="text-sm font-medium">مستوى اللغة</label>
                                    <Select
                                        value={newTask.english_level}
                                        onValueChange={(val) => setNewTask({ ...newTask, english_level: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">مستوى A</SelectItem>
                                            <SelectItem value="B">مستوى B</SelectItem>
                                            <SelectItem value="C">مستوى C</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </>
                            ) : (
                                <>
                                    <label className="text-sm font-medium">المستوى العام</label>
                                    <Select
                                        value={newTask.level}
                                        onValueChange={(val) => setNewTask({ ...newTask, level: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">كل المستويات</SelectItem>
                                            <SelectItem value="Beginner">مبتدئ</SelectItem>
                                            <SelectItem value="Intermediate">متوسط</SelectItem>
                                            <SelectItem value="Advanced">متقدم</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">نقاط الخبرة (XP)</label>
                            <Input
                                type="number"
                                value={newTask.xp}
                                onChange={(e) => setNewTask({ ...newTask, xp: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">رابط الموارد (اختياري)</label>
                            <Input
                                placeholder="رابط ملف أو مرجع..."
                                value={newTask.resource_link}
                                onChange={(e) => setNewTask({ ...newTask, resource_link: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        إلغاء
                    </Button>
                    <Button onClick={handleAddTask} disabled={loading} className="bg-secondary text-white hover:bg-secondary/90">
                        {loading ? "جاري الإضافة..." : "حفظ المهمة"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
