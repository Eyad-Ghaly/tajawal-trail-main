import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Image as ImageIcon, Video, Trash2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
    id: string;
    content: string;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
    user_id: string;
    profile: {
        full_name: string;
        avatar_url: string | null;
        role: string;
    };
}

const Posts = () => {
    const { toast } = useToast();
    const [profile, setProfile] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // New Post State
    const [newPostContent, setNewPostContent] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

    useEffect(() => {
        checkUser();
        loadPosts();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setProfile(profile);
            setIsAdmin(profile?.role === 'admin');
        }
    };

    const loadPosts = async () => {
        try {
            const { data, error } = await supabase
                .from("posts" as any)
                .select(`
          *,
          profile:profiles(full_name, avatar_url, role)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPosts((data as any) || []);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
            // Reset video if image is selected (optional, or allow both?)
            // setSelectedVideo(null); 
        }
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedVideo(e.target.files[0]);
        }
    };

    const uploadMedia = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('post-media')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !selectedImage && !selectedVideo) return;

        setSubmitting(true);
        try {
            let imageUrl = null;
            let videoUrl = null;

            if (selectedImage) {
                imageUrl = await uploadMedia(selectedImage);
            }

            if (selectedVideo) {
                videoUrl = await uploadMedia(selectedVideo);
            }

            const { error } = await supabase
                .from("posts" as any)
                .insert({
                    content: newPostContent,
                    image_url: imageUrl,
                    video_url: videoUrl,
                    user_id: profile.id
                });

            if (error) throw error;

            setNewPostContent("");
            setSelectedImage(null);
            setSelectedVideo(null);
            loadPosts();

            toast({
                title: "تم النشر بنجاح",
                description: "تم إضافة منشورك الجديد",
            });
        } catch (error) {
            console.error("Error creating post:", error);
            toast({
                title: "خطأ",
                description: "حدث خطأ أثناء النشر",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            const { error } = await supabase
                .from("posts" as any)
                .delete()
                .eq("id", postId);

            if (error) throw error;

            setPosts(posts.filter(p => p.id !== postId));
            toast({
                title: "تم الحذف",
                description: "تم حذف المنشور بنجاح",
            });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({
                title: "خطأ",
                description: "حدث خطأ أثناء الحذف",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container max-w-2xl py-8 space-y-6">
                <h1 className="text-3xl font-bold mb-6">المنشورات والتحديثات</h1>

                {/* Create Post Section - Admin Only */}
                {isAdmin && (
                    <Card className="shadow-lg border-2 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg">إضافة منشور جديد</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="بم تفكر؟"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                className="min-h-[100px] resize-none text-lg"
                            />

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="image-upload"
                                        onChange={handleImageSelect}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        className={selectedImage ? "border-primary text-primary" : ""}
                                    >
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        {selectedImage ? "تم اختيار صورة" : "صورة"}
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        id="video-upload"
                                        onChange={handleVideoSelect}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => document.getElementById('video-upload')?.click()}
                                        className={selectedVideo ? "border-primary text-primary" : ""}
                                    >
                                        <Video className="h-4 w-4 mr-2" />
                                        {selectedVideo ? "تم اختيار فيديو" : "فيديو"}
                                    </Button>
                                </div>
                            </div>

                            {(selectedImage || selectedVideo) && (
                                <div className="p-2 bg-muted rounded text-sm relative">
                                    {selectedImage && <p>📸 {selectedImage.name}</p>}
                                    {selectedVideo && <p>🎥 {selectedVideo.name}</p>}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-1 left-2 h-6 w-6 p-0"
                                        onClick={() => { setSelectedImage(null); setSelectedVideo(null); }}
                                    >
                                        ×
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={handleCreatePost}
                                disabled={submitting || (!newPostContent.trim() && !selectedImage && !selectedVideo)}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        جاري النشر...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        نشر
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Posts List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            لا توجد منشورات حتى الآن
                        </div>
                    ) : (
                        posts.map((post) => (
                            <Card key={post.id} className="shadow-md overflow-hidden">
                                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                                    <Avatar>
                                        <AvatarImage src={post.profile?.avatar_url || ''} />
                                        <AvatarFallback>{post.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">{post.profile?.full_name}</h3>
                                            {isAdmin && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDeletePost(post.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            حذف المنشور
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar })}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="whitespace-pre-wrap text-lg leading-relaxed">{post.content}</p>

                                    {post.image_url && (
                                        <div className="rounded-lg overflow-hidden border">
                                            <img
                                                src={post.image_url}
                                                alt="Post attachment"
                                                className="w-full h-auto max-h-[500px] object-cover"
                                            />
                                        </div>
                                    )}

                                    {post.video_url && (
                                        <div className="rounded-lg overflow-hidden border bg-black">
                                            <video
                                                controls
                                                className="w-full h-auto max-h-[500px]"
                                                src={post.video_url}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Posts;
