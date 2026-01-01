import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Image as ImageIcon, Video, Trash2, MoreVertical, Heart, MessageCircle, BarChart2, Plus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface Profile {
    full_name: string;
    avatar_url: string | null;
    role: string;
}

interface PollOption {
    id: string;
    option_text: string;
    poll_votes: { user_id: string }[];
}

interface PostComment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profile: Profile;
}

interface PostLike {
    user_id: string;
}

interface Post {
    id: string;
    content: string;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
    user_id: string;
    type: 'text' | 'poll';
    profile: Profile;
    post_likes: PostLike[];
    post_comments: PostComment[];
    poll_options: PollOption[];
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
    const [postType, setPostType] = useState<'text' | 'poll'>('text');
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

    // Comment State (map of postId -> comment content)
    const [commentContent, setCommentContent] = useState<Record<string, string>>({});
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

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
                    profile:profiles(full_name, avatar_url, role),
                    post_likes(user_id),
                    post_comments(
                        id, 
                        content, 
                        created_at, 
                        user_id, 
                        profile:profiles(full_name, avatar_url, role)
                    ),
                    poll_options(
                        id, 
                        option_text,
                        poll_votes(user_id)
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Transform data to sort comments and poll options if needed
            const formattedPosts = (data as any[]).map(post => ({
                ...post,
                poll_options: post.poll_options?.sort((a: any, b: any) => a.option_text.localeCompare(b.option_text)) || [],
                post_comments: post.post_comments?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
            }));

            setPosts(formattedPosts);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
            setSelectedVideo(null); // Ensure mutually exclusive if needed, or allow both
        }
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedVideo(e.target.files[0]);
            setSelectedImage(null);
        }
    };

    const handlePollOptionChange = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const addPollOption = () => {
        if (pollOptions.length < 5) {
            setPollOptions([...pollOptions, ""]);
        }
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            const newOptions = pollOptions.filter((_, i) => i !== index);
            setPollOptions(newOptions);
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
        if (!newPostContent.trim() && !selectedImage && !selectedVideo && postType === 'text') return;
        if (postType === 'poll' && (!newPostContent.trim() || pollOptions.some(opt => !opt.trim()))) {
            toast({
                title: "تنبيه",
                description: "يرجى ملء سؤال التصويت وجميع الخيارات",
                variant: "destructive",
            });
            return;
        }

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

            // Insert Post
            const { data: postData, error: postError } = await supabase
                .from("posts" as any)
                .insert({
                    content: newPostContent,
                    image_url: imageUrl,
                    video_url: videoUrl,
                    user_id: profile.id,
                    type: postType
                })
                .select()
                .single();

            if (postError) throw postError;

            // Insert Poll Options if applicable
            if (postType === 'poll' && postData) {
                const optionsToInsert = pollOptions.map(opt => ({
                    post_id: postData.id,
                    option_text: opt
                }));

                const { error: pollError } = await supabase
                    .from("poll_options")
                    .insert(optionsToInsert);

                if (pollError) throw pollError;
            }

            setNewPostContent("");
            setSelectedImage(null);
            setSelectedVideo(null);
            setPostType('text');
            setPollOptions(["", ""]);
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

    // Interaction Handlers
    const handleLike = async (post: Post) => {
        const hasLiked = post.post_likes.some(like => like.user_id === profile.id);

        try {
            if (hasLiked) {
                await supabase
                    .from("post_likes")
                    .delete()
                    .eq("post_id", post.id)
                    .eq("user_id", profile.id);
            } else {
                await supabase
                    .from("post_likes")
                    .insert({ post_id: post.id, user_id: profile.id });
            }
            loadPosts(); // Refresh to get updated counts/state
        } catch (error) {
            console.error("Error handling like:", error);
        }
    };

    const handleVote = async (post: Post, optionId: string) => {
        const hasVoted = post.poll_options.some(opt => opt.poll_votes.some(v => v.user_id === profile.id));
        if (hasVoted) {
            toast({
                title: "تنبيه",
                description: "لقد قمت بالتصويت بالفعل",
                variant: "destructive",
            });
            return;
        }

        try {
            await supabase
                .from("poll_votes")
                .insert({
                    post_id: post.id,
                    option_id: optionId,
                    user_id: profile.id
                });
            loadPosts();
        } catch (error) {
            console.error("Error voting:", error);
        }
    };

    const handleAddComment = async (postId: string) => {
        const content = commentContent[postId]?.trim();
        if (!content) return;

        try {
            const { error } = await supabase
                .from("post_comments")
                .insert({
                    post_id: postId,
                    user_id: profile.id,
                    content: content
                });

            if (error) throw error;

            setCommentContent(prev => ({ ...prev, [postId]: "" }));
            loadPosts();
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container max-w-2xl px-4 py-6 md:py-8 space-y-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">المنشورات والتحديثات</h1>

                {/* Create Post Section - Admin Only */}
                {isAdmin && (
                    <Card className="shadow-lg border-2 border-primary/10">
                        <CardHeader className="p-4 md:p-6 pb-2">
                            <div className="flex gap-4 mb-4">
                                <Button
                                    variant={postType === 'text' ? "default" : "outline"}
                                    onClick={() => setPostType('text')}
                                    className="flex-1"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    منشور عادي
                                </Button>
                                <Button
                                    variant={postType === 'poll' ? "default" : "outline"}
                                    onClick={() => setPostType('poll')}
                                    className="flex-1"
                                >
                                    <BarChart2 className="w-4 h-4 mr-2" />
                                    تصويت
                                </Button>
                            </div>
                            <CardTitle className="text-lg">
                                {postType === 'text' ? 'إضافة منشور جديد' : 'إنشاء تصويت جديد'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6 space-y-4">
                            <Textarea
                                placeholder={postType === 'text' ? "بم تفكر؟" : "اطرح سؤالك للتصويت..."}
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                className="min-h-[100px] md:min-h-[120px] resize-none text-base md:text-lg"
                            />

                            {postType === 'poll' && (
                                <div className="space-y-3">
                                    {pollOptions.map((option, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder={`خيار ${index + 1}`}
                                                value={option}
                                                onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                            />
                                            {pollOptions.length > 2 && (
                                                <Button variant="ghost" size="icon" onClick={() => removePollOption(index)}>
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {pollOptions.length < 5 && (
                                        <Button variant="outline" size="sm" onClick={addPollOption} className="w-full">
                                            <Plus className="h-4 w-4 mr-2" /> إضافة خيار آخر
                                        </Button>
                                    )}
                                </div>
                            )}

                            {postType === 'text' && (
                                <div className="flex flex-wrap gap-2 md:gap-4">
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
                                            size="sm"
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                            className={selectedImage ? "border-primary text-primary" : ""}
                                        >
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">{selectedImage ? "تم اختيار صورة" : "صورة"}</span>
                                            <span className="sm:hidden">صورة</span>
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
                                            size="sm"
                                            onClick={() => document.getElementById('video-upload')?.click()}
                                            className={selectedVideo ? "border-primary text-primary" : ""}
                                        >
                                            <Video className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">{selectedVideo ? "تم اختيار فيديو" : "فيديو"}</span>
                                            <span className="sm:hidden">فيديو</span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {(selectedImage || selectedVideo) && (
                                <div className="p-2 bg-muted rounded text-sm relative">
                                    {selectedImage && <p className="truncate">📸 {selectedImage.name}</p>}
                                    {selectedVideo && <p className="truncate">🎥 {selectedVideo.name}</p>}
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
                        <CardFooter className="p-4 md:p-6 flex justify-end">
                            <Button
                                className="w-full sm:w-auto"
                                onClick={handleCreatePost}
                                disabled={submitting || (postType === 'text' && !newPostContent.trim() && !selectedImage && !selectedVideo)}
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
                <div className="space-y-4 md:space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            لا توجد منشورات حتى الآن
                        </div>
                    ) : (
                        posts.map((post) => {
                            const isLiked = post.post_likes.some(like => like.user_id === profile?.id);
                            const likesCount = post.post_likes.length;
                            const commentsCount = post.post_comments.length;
                            const hasVoted = post.poll_options?.some(opt => opt.poll_votes.some(v => v.user_id === profile?.id));
                            const totalVotes = post.poll_options?.reduce((sum, opt) => sum + opt.poll_votes.length, 0) || 0;

                            return (
                                <Card key={post.id} className="shadow-md overflow-hidden border-none md:border">
                                    <CardHeader className="flex flex-row items-start gap-3 md:gap-4 space-y-0 p-4 pb-2 md:p-6 md:pb-2">
                                        <Avatar className="h-10 w-10 md:h-12 md:w-12">
                                            <AvatarImage src={post.profile?.avatar_url || ''} />
                                            <AvatarFallback>{post.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-semibold truncate text-base md:text-lg">{post.profile?.full_name}</h3>
                                                {isAdmin && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ar })}
                                            </p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2 md:p-6 md:pt-4 space-y-4">
                                        <p className="whitespace-pre-wrap text-base md:text-lg leading-relaxed">{post.content}</p>

                                        {/* Poll Display */}
                                        {post.type === 'poll' && post.poll_options && (
                                            <div className="space-y-3 mt-4">
                                                {post.poll_options.map((option) => {
                                                    const votes = option.poll_votes.length;
                                                    const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                                                    const isSelected = option.poll_votes.some(v => v.user_id === profile?.id);

                                                    return (
                                                        <div key={option.id} className="space-y-1">
                                                            <button
                                                                onClick={() => handleVote(post, option.id)}
                                                                disabled={hasVoted}
                                                                className={`w-full text-right p-3 rounded-md border transition-all ${hasVoted
                                                                        ? isSelected
                                                                            ? "border-primary bg-primary/10"
                                                                            : "border-transparent bg-muted/50"
                                                                        : "border-muted hover:border-primary/50 hover:bg-muted"
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between mb-1">
                                                                    <span className={`font-medium ${isSelected ? "text-primary" : ""}`}>
                                                                        {option.option_text}
                                                                    </span>
                                                                    {hasVoted && (
                                                                        <span className="text-muted-foreground text-sm">{percentage}%</span>
                                                                    )}
                                                                </div>
                                                                {hasVoted && (
                                                                    <Progress value={percentage} className="h-2" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                <p className="text-xs text-muted-foreground text-center mt-2">
                                                    {totalVotes} صوت
                                                </p>
                                            </div>
                                        )}

                                        {/* Media Display */}
                                        {post.image_url && (
                                            <div className="rounded-lg overflow-hidden border -mx-4 md:mx-0">
                                                <img
                                                    src={post.image_url}
                                                    alt="Post attachment"
                                                    className="w-full h-auto max-h-[400px] md:max-h-[500px] object-cover"
                                                />
                                            </div>
                                        )}

                                        {post.video_url && (
                                            <div className="rounded-lg overflow-hidden border bg-black -mx-4 md:mx-0">
                                                <video
                                                    controls
                                                    className="w-full h-auto max-h-[400px] md:max-h-[500px]"
                                                    src={post.video_url}
                                                />
                                            </div>
                                        )}
                                    </CardContent>

                                    {/* Actions */}
                                    <div className="px-4 md:px-6">
                                        <Separator className="mb-2" />
                                        <div className="flex items-center justify-between py-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`gap-2 ${isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground"}`}
                                                onClick={() => handleLike(post)}
                                            >
                                                <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                                                <span className="text-sm">{likesCount > 0 ? likesCount : "إعجاب"}</span>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-2 text-muted-foreground"
                                                onClick={() => toggleComments(post.id)}
                                            >
                                                <MessageCircle className="h-5 w-5" />
                                                <span className="text-sm">{commentsCount > 0 ? commentsCount : "تعليق"}</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    {expandedComments[post.id] && (
                                        <div className="bg-muted/30 p-4 md:p-6 pt-0 space-y-4">
                                            <Separator className="mb-4" />

                                            {/* Add Comment */}
                                            <div className="flex gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={profile?.avatar_url || ''} />
                                                    <AvatarFallback>{profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 flex gap-2">
                                                    <Input
                                                        placeholder="أكتب تعليقاً..."
                                                        className="h-9"
                                                        value={commentContent[post.id] || ""}
                                                        onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddComment(post.id);
                                                        }}
                                                    />
                                                    <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => handleAddComment(post.id)}>
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* List Comments */}
                                            <div className="space-y-4 mt-4">
                                                {post.post_comments.map((comment) => (
                                                    <div key={comment.id} className="flex gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={comment.profile?.avatar_url || ''} />
                                                            <AvatarFallback>{comment.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 bg-background p-3 rounded-lg border text-sm">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-semibold">{comment.profile?.full_name}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ar })}
                                                                </span>
                                                            </div>
                                                            <p className="text-foreground/90 leading-relaxed">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Posts;
