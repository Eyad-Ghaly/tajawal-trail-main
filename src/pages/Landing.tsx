
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Users, ArrowRight, Sparkles } from "lucide-react";

const Landing = () => {
    const navigate = useNavigate();

    const handleRoleSelect = (role: "learner" | "team_leader") => {
        navigate("/auth", { state: { role } });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="z-10 max-w-4xl w-full space-y-12 text-center">
                {/* Hero Section */}
                <div className="space-y-6 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span>ابدأ رحلة التطوير المهني</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-indigo-200">
                        منصة تطوير
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        منصتك الشاملة لتعلم مهارات المستقبل. اختر مسارك وانضم إلى مجتمع من المبدعين والقادة.
                    </p>
                </div>

                {/* Role Selection */}
                <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
                    {/* Learner Card */}
                    <button
                        onClick={() => handleRoleSelect("learner")}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <User className="w-10 h-10 text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">ألتحق كمتعلم</h3>
                                    <p className="text-slate-400">
                                        أبحث عن تطوير مهاراتي والانضمام إلى فرق عمل متميزة
                                    </p>
                                </div>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none group-hover:bg-blue-500">
                                    سجل الآن
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </button>

                    {/* Team Leader Card */}
                    <button
                        onClick={() => handleRoleSelect("team_leader")}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-10 h-10 text-purple-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">قائد فريق</h3>
                                    <p className="text-slate-400">
                                        أريد إنشاء فريقي الخاص وإدارة تقدم الأعضاء
                                    </p>
                                </div>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-none group-hover:bg-purple-500">
                                    أنشئ فريقك
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Landing;
