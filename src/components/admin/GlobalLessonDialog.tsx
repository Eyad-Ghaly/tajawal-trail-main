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
import { Plus, BookOpen } from "lucide-react";

interface GlobalLessonDialogProps {
    onLessonAdded: () => void;
}

export const GlobalLessonDialog = ({ onLessonAdded }: GlobalLessonDialogProps) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newLesson, setNewLesson] = useState({
        title: "",
        description: "",
        video_link: "",
        track_type: "data",
        level: "Beginner",
        english_level: "B", // Default English Level
        order_index: 0,
    });

    const handleAddLesson = async () => {
        if (!newLesson.title.trim()) {
            toast({
                title: "خطأ",
                description: "يرجى إدخال عنوان الدرس",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.from("lessons").insert({
            title: newLesson.title,
            description: newLesson.description || null,
            video_link: newLesson.video_link || null,
            track_type: newLesson.track_type,
            level: newLesson.track_type === 'english' ? null : (newLesson.level === "all" ? null : newLesson.level),
            english_level: newLesson.track_type === 'english' ? newLesson.english_level : null,
            order_index: newLesson.order_index,
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
                title: "تم إضافة الدرس بنجاح ✅",
            });
            setNewLesson({
                title: "",
                description: "",
                video_link: "",
                track_type: "data",
                level: "Beginner",
                english_level: "B",
                order_index: 0,
            });
            setOpen(false);
            onLessonAdded();
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    إضافة درس جديد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>إضافة درس للمنهج الأساسي</DialogTitle>
                    <DialogDescription>
                        قم بإضافة درس جديد سيظهر لجميع الطلاب في المستوى المختار.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">عنوان الدرس *</label>
                        <Input
                            placeholder="مثال: مقدمة في الإكسل"
                            value={newLesson.title}
                            onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">الوصف</label>
                        <Textarea
                            placeholder="وصف مختصر لمحتوى الدرس..."
                            value={newLesson.description}
                            onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">المسار</label>
                            <Select
                                value={newLesson.track_type}
                                onValueChange={(val) => setNewLesson({ ...newLesson, track_type: val })}
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
                            {newLesson.track_type === 'english' ? (
                                <>
                                    <label className="text-sm font-medium">مستوى اللغة</label>
                                    <Select
                                        value={newLesson.english_level}
                                        onValueChange={(val) => setNewLesson({ ...newLesson, english_level: val })}
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
                                        value={newLesson.level}
                                        onValueChange={(val) => setNewLesson({ ...newLesson, level: val })}
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium">رابط الفيديو</label>
                        <Input
                            placeholder="https://youtube.com/..."
                            value={newLesson.video_link}
                            onChange={(e) => setNewLesson({ ...newLesson, video_link: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">ترتيب العرض</label>
                        <Input
                            type="number"
                            value={newLesson.order_index}
                            onChange={(e) => setNewLesson({ ...newLesson, order_index: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        إلغاء
                    </Button>
                    <Button onClick={handleAddLesson} disabled={loading}>
                        {loading ? "جاري الإضافة..." : "حفظ الدرس"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
