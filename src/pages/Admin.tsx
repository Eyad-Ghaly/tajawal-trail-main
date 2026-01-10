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
  role: "learner" | "admin" | "team_leader";
  join_date: string;
  email?: string;
  phone_number?: string;
}

// ... (Existing Interfaces) ...

// ... (Inside TabsContent for "pending-users") ...
          <TabsContent value="pending-users" className="space-y-4">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>طلبات الانضمام المعلقة</CardTitle>
                <CardDescription>
                  مراجعة وقبول أو رفض طلبات التسجيل الجديدة
                  <span className="block mt-1 text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded w-fit">
                    [Debug] Found: {pendingUsers.length} records
                  </span>
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
                          {lesson.track_type === 'english' ? (
                            <Select
                              value={lesson.english_level || "B"}
                              onValueChange={(value) => handleLessonEnglishLevelChange(lesson.id, value as "A" | "B" | "C")}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">مستوى A</SelectItem>
                                <SelectItem value="B">مستوى B</SelectItem>
                                <SelectItem value="C">مستوى C</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
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
                          )}
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
                          {task.track_type === 'english' ? (
                            <Select
                              value={task.english_level || "B"}
                              onValueChange={(value) => handleTaskEnglishLevelChange(task.id, value as "A" | "B" | "C")}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">مستوى A</SelectItem>
                                <SelectItem value="B">مستوى B</SelectItem>
                                <SelectItem value="C">مستوى C</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
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
                          )}
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