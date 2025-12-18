import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { chatMessageSchema, validateOrThrow } from '@/lib/validations';

interface PublicProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  level: string | null;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  image_url: string | null;
  created_at: string;
  profile?: PublicProfile;
}

interface ChatRoomProps {
  lessonId?: string;
  levelClassroom?: 'Beginner' | 'Intermediate' | 'Advanced';
  title: string;
}

export function ChatRoom({ lessonId, levelClassroom, title }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: lessonId 
            ? `lesson_id=eq.${lessonId}` 
            : `level_classroom=eq.${levelClassroom}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, levelClassroom]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      } else if (levelClassroom) {
        query = query.eq('level_classroom', levelClassroom);
      }

      const { data: messagesData, error: messagesError } = await query;

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      // Get unique user IDs from messages
      const userIds = [...new Set(messagesData.map(msg => msg.user_id))];

      // Fetch public profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('public_profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by user ID
      const profilesMap = new Map<string, PublicProfile>();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Combine messages with profiles
      const messagesWithProfiles: Message[] = messagesData.map(msg => ({
        ...msg,
        profile: profilesMap.get(msg.user_id),
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الرسائل',
        variant: 'destructive',
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'خطأ',
          description: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت',
          variant: 'destructive',
        });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !currentUserId) return;

    // Validate message length if there's text
    if (newMessage.trim()) {
      try {
        validateOrThrow(chatMessageSchema, newMessage);
      } catch (error: any) {
        toast({
          title: 'خطأ',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const messageData: any = {
        user_id: currentUserId,
        message: newMessage.trim() || '',
        image_url: imageUrl,
      };

      if (lessonId) {
        messageData.lesson_id = lessonId;
      } else if (levelClassroom) {
        messageData.level_classroom = levelClassroom;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([messageData]);

      if (error) throw error;

      setNewMessage('');
      removeImage();
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رسالتك بنجاح',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إرسال الرسالة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الرسالة بنجاح',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف الرسالة',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.user_id === currentUserId ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {msg.profile?.full_name?.charAt(0) || '؟'}
                </span>
              </div>
              
              <div className={`flex-1 ${msg.user_id === currentUserId ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {msg.profile?.full_name || 'مستخدم'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), 'HH:mm', { locale: ar })}
                  </span>
                  {msg.user_id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMessage(msg.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    msg.user_id === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.image_url && (
                    <img 
                      src={msg.image_url} 
                      alt="صورة مرفقة"
                      className="max-w-xs rounded-lg mb-2"
                    />
                  )}
                  {msg.message && (
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        {imagePreview && (
          <div className="mb-2 relative inline-block">
            <img 
              src={imagePreview} 
              alt="معاينة"
              className="max-h-32 rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={removeImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="shrink-0"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || (!newMessage.trim() && !selectedImage)}
            size="icon"
            className="h-auto"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
