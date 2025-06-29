import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Trash2, Edit3, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import type { Comment } from "@shared/schema";

interface CommentsSectionProps {
  designId: number;
  userId: number;
}

export default function CommentsSection({ designId, userId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/designs/${designId}/comments`],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/designs/${designId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          userId,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/designs/${designId}/comments`] });
      setNewComment("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/designs/${designId}/comments`] });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const getInitials = (userId: number) => {
    return `U${userId}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return d.toLocaleDateString();
    }
  };

  return (
    <Card className="result-card rounded-3xl border-0">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
            <MessageCircle className="text-white w-5 h-5" />
          </div>
          <CardTitle className="text-xl font-sf-pro">Discussion</CardTitle>
          <span className="text-sm text-gray-500">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="bg-gray-50/70 rounded-xl p-4">
          <Textarea
            placeholder="Share your thoughts, questions, or suggestions about this vaccine design..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none border-0 bg-transparent focus-visible:ring-0 placeholder:text-gray-500"
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="glass-button rounded-xl"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment: Comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                  {getInitials(comment.userId)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">
                        User {comment.userId}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(comment.createdAt!)}
                      </span>
                    </div>
                    
                    {comment.userId === userId && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(comment)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-500"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] resize-none"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Update comment logic would go here
                            cancelEditing();
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
                
                {/* Comment metadata */}
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <p className="text-xs text-gray-500 mt-1 ml-4">
                    Edited {formatDate(comment.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No comments yet.</p>
              <p className="text-xs">Start the discussion by adding your thoughts above.</p>
            </div>
          )}
        </div>
        
        {/* Comment Guidelines */}
        <div className="bg-blue-50/50 rounded-xl p-4 mt-6">
          <h4 className="font-medium text-blue-800 mb-2">Discussion Guidelines</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Share constructive feedback on the vaccine design</li>
            <li>• Ask questions about methodology or results</li>
            <li>• Suggest improvements or alternative approaches</li>
            <li>• Keep discussions scientific and professional</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}