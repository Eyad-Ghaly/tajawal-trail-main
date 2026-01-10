import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus, ExternalLink, KeyRound, ArrowRight, Eye, EyeOff, Users, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loginSchema, signupSchema, forgotPasswordSchema, validateOrThrow } from "@/lib/validations";

const GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "البحر الأحمر",
  "البحيرة",
  "الفيوم",
  "الغربية",
  "الإسماعيلية",
  "المنوفية",
  "المنيا",
  "القليوبية",
  "الوادي الجديد",
  "السويس",
  "أسوان",
  "أسيوط",
  "بني سويف",
  "بورسعيد",
  "دمياط",
  "الشرقية",
  "جنوب سيناء",
  "كفر الشيخ",
  "مطروح",
  "الأقصر",
  "قنا",
  "شمال سيناء",
  "سوهاج"
];

const PLACEMENT_TEST_URL = "https://forms.google.com/your-placement-test"; // يمكن تغييره لاحقاً

type AuthMode = "login" | "signup" | "forgot-password";
type UserRole = "learner" | "team_leader";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("learner");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("+20");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Team Fields
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
      setMode("signup");
    }
  }, [location.state]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const validData = validateOrThrow(loginSchema, { email, password });

        const { error } = await supabase.auth.signInWithPassword({
          email: validData.email,
          password: validData.password,
        });

        if (error) throw error;

        toast({
          title: "مرحباً بعودتك!",
          description: "تم تسجيل الدخول بنجاح",
        });

        navigate("/dashboard");
      } else if (mode === "signup") {
        // Validate basic fields
        const validData = validateOrThrow(signupSchema, {
          email,
          fullName,
          governorate,
          membershipNumber,
          phoneCode,
          phoneNumber,
          password,
          confirmPassword
        });

        // Prepare Metadata
        const metaData: any = {
          full_name: validData.fullName,
          role: role, // 'learner' or 'team_leader'
          level: "Beginner",
          governorate: validData.governorate,
          membership_number: validData.membershipNumber,
          phone_number: `${validData.phoneCode}${validData.phoneNumber}`,
        };

        // Handle Role Specific Logic
        if (role === 'team_leader') {
          if (!teamName.trim()) throw new Error("يرجى إدخال اسم الفريق");
          metaData.team_name = teamName.trim();
        }
        else if (role === 'learner') {
          if (teamCode.trim()) {
            // Verify Team Code
            const { data: team, error: teamError } = await supabase
              .from('teams')
              .select('id')
              .eq('code', teamCode.trim())
              .single();

            if (teamError || !team) throw new Error("كود الفريق غير صحيح");
            metaData.team_id = team.id;
          }
        }

        const { error } = await supabase.auth.signUp({
          email: validData.email,
          password: validData.password,
          options: {
            data: metaData,
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        toast({
          title: "تم إنشاء الحساب!",
          description: "شكراً لتسجيلك في المنصة. حسابك قيد المراجعة.",
        });

        setMode("login");
      } else if (mode === "forgot-password") {
        const validData = validateOrThrow(forgotPasswordSchema, { email });

        const { error } = await supabase.auth.resetPasswordForEmail(validData.email, {
          redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) throw error;

        toast({
          title: "تم إرسال الرابط!",
          description: "تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور",
        });

        setMode("login");
      }
    } catch (error: any) {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "مرحباً بعودتك! سجل دخولك للمتابعة";
      case "signup": return role === 'team_leader' ? "تسجيل قائد فريق جديد" : "تسجيل متعلم جديد";
      case "forgot-password": return "أدخل بريدك الإلكتروني لاستعادة كلمة المرور";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${role === 'team_leader' && mode === 'signup' ? 'bg-purple-100' : 'bg-primary/10'}`}>
              {mode === "forgot-password" ? (
                <KeyRound className="w-10 h-10 text-primary" />
              ) : role === 'team_leader' && mode === 'signup' ? (
                <Users className="w-10 h-10 text-purple-600" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            {mode === "forgot-password" ? "استعادة كلمة المرور" : "منصة تطوير"}
          </CardTitle>
          <CardDescription className="text-base">
            {getTitle()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="أدخل اسمك الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {role === 'team_leader' ? (
                  <div className="space-y-2">
                    <Label htmlFor="teamName">اسم الفريق</Label>
                    <Input
                      id="teamName"
                      type="text"
                      placeholder="اسم فريقك (مثل: فريق النخبة)"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                      disabled={loading}
                      className="border-purple-200 focus-visible:ring-purple-500"
                    />
                    <p className="text-xs text-muted-foreground">سيتم إنشاء كود خاص بفريقك تلقائياً</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="teamCode">كود الفريق (اختياري)</Label>
                    <Input
                      id="teamCode"
                      type="text"
                      placeholder="أدخل كود الفريق إذا وجد"
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">إذا لم تدخل كود، سيتم إضافتك للفريق الرئيسي</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="governorate">المحافظة</Label>
                  <Select
                    value={governorate}
                    onValueChange={setGovernorate}
                    disabled={loading}
                  >
                    <SelectTrigger id="governorate">
                      <SelectValue placeholder="اختر محافظتك" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOVERNORATES.map((gov) => (
                        <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membershipNumber">رقم العضوية</Label>
                  <Input
                    id="membershipNumber"
                    type="text"
                    placeholder="أدخل رقم العضوية"
                    value={membershipNumber}
                    onChange={(e) => setMembershipNumber(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                  <div className="flex gap-2">
                    <Select
                      value={phoneCode}
                      onValueChange={setPhoneCode}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="+20" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+20">+20 (EG)</SelectItem>
                        <SelectItem value="+966">+966 (SA)</SelectItem>
                        <SelectItem value="+971">+971 (UAE)</SelectItem>
                        <SelectItem value="+965">+965 (KW)</SelectItem>
                        <SelectItem value="+974">+974 (QA)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      disabled={loading}
                      dir="ltr"
                      className="flex-1"
                    />
                  </div>
                </div>

                {role === 'learner' && (
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-2">
                      اختبار تحديد المستوى (اختياري)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(PLACEMENT_TEST_URL, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      خذ اختبار تحديد المستوى
                    </Button>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                dir="ltr"
                className="text-left"
              />
            </div>

            {mode !== "forgot-password" && (
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    dir="ltr"
                    className="text-left pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground hover:text-primary"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    dir="ltr"
                    className="text-left pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground hover:text-primary"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="text-start">
                <button
                  type="button"
                  onClick={() => setMode("forgot-password")}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  disabled={loading}
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحميل...
                </>
              ) : mode === "login" ? (
                <>
                  <LogIn className="ml-2 h-4 w-4" />
                  تسجيل الدخول
                </>
              ) : mode === "signup" ? (
                <>
                  <UserPlus className="ml-2 h-4 w-4" />
                  إنشاء حساب
                </>
              ) : (
                <>
                  <KeyRound className="ml-2 h-4 w-4" />
                  إرسال رابط الاستعادة
                </>
              )}
            </Button>

            {mode === "forgot-password" && (
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => setMode("login")}
                disabled={loading}
              >
                <ArrowRight className="h-4 w-4" />
                العودة لتسجيل الدخول
              </Button>
            )}

            {mode !== "forgot-password" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  {mode === "login"
                    ? "ليس لديك حساب؟ سجل الآن"
                    : "لديك حساب بالفعل؟ سجل دخولك"}
                </button>
                {mode === "signup" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <button type="button" onClick={() => navigate('/')} className="hover:underline text-blue-500">
                      تغيير نوع التسجيل
                    </button>
                  </p>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
