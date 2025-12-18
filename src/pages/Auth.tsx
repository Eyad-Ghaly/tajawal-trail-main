import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus, ExternalLink, KeyRound, ArrowRight } from "lucide-react";
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

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
        const validData = validateOrThrow(signupSchema, { 
          email, 
          password, 
          fullName, 
          governorate, 
          membershipNumber 
        });

        const { error } = await supabase.auth.signUp({
          email: validData.email,
          password: validData.password,
          options: {
            data: {
              full_name: validData.fullName,
              role: "learner",
              level: "Beginner",
              governorate: validData.governorate,
              membership_number: validData.membershipNumber,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "تم إنشاء الحساب!",
          description: "حسابك معلق حالياً وسيتم مراجعته من قبل الإدارة",
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
      case "signup": return "انضم إلينا وابدأ رحلة التطوير";
      case "forgot-password": return "أدخل بريدك الإلكتروني لاستعادة كلمة المرور";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {mode === "forgot-password" ? (
                <KeyRound className="w-10 h-10 text-primary" />
              ) : (
                <svg
                  className="w-10 h-10 text-primary"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
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

                {/* Placement Test Link */}
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
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  dir="ltr"
                  className="text-left"
                />
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
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
