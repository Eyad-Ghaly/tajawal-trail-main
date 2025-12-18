import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { ChatRoom } from '@/components/ChatRoom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export default function Classrooms() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLevel = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('level')
          .eq('id', user.id)
          .single();

        setUserLevel(profile?.level || 'Beginner');
      } catch (error) {
        console.error('Error fetching user level:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLevel();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-4 md:p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">الفصول الدراسية</h1>
          <p className="text-muted-foreground">
            تواصل مع زملائك في نفس المستوى وشارك الأفكار والأسئلة
          </p>
        </div>

        <Tabs defaultValue={userLevel || 'Beginner'} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="Beginner" className="gap-2">
              <Users className="h-4 w-4" />
              مبتدئ
            </TabsTrigger>
            <TabsTrigger value="Intermediate" className="gap-2">
              <Users className="h-4 w-4" />
              متوسط
            </TabsTrigger>
            <TabsTrigger value="Advanced" className="gap-2">
              <Users className="h-4 w-4" />
              متقدم
            </TabsTrigger>
          </TabsList>

          <TabsContent value="Beginner">
            <Card className="p-4 mb-4 bg-muted/50">
              <h3 className="font-semibold mb-2">فصل المبتدئين</h3>
              <p className="text-sm text-muted-foreground">
                مكان آمن للمبتدئين لطرح الأسئلة والتعلم من بعضهم البعض
              </p>
            </Card>
            <ChatRoom
              levelClassroom="Beginner"
              title="محادثة المبتدئين"
            />
          </TabsContent>

          <TabsContent value="Intermediate">
            <Card className="p-4 mb-4 bg-muted/50">
              <h3 className="font-semibold mb-2">فصل المتوسطين</h3>
              <p className="text-sm text-muted-foreground">
                ناقش المواضيع المتقدمة وشارك خبراتك مع المستوى المتوسط
              </p>
            </Card>
            <ChatRoom
              levelClassroom="Intermediate"
              title="محادثة المتوسطين"
            />
          </TabsContent>

          <TabsContent value="Advanced">
            <Card className="p-4 mb-4 bg-muted/50">
              <h3 className="font-semibold mb-2">فصل المتقدمين</h3>
              <p className="text-sm text-muted-foreground">
                تعاون مع الخبراء وناقش أفضل الممارسات والتقنيات المتقدمة
              </p>
            </Card>
            <ChatRoom
              levelClassroom="Advanced"
              title="محادثة المتقدمين"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
