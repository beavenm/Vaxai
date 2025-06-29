import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2, Users, Mail, Lock, Edit, Eye, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import type { VaccineDesign, ProjectShare, Team } from "@shared/schema";

interface ProjectSharingProps {
  design: VaccineDesign;
  userId: number;
}

export default function ProjectSharing({ design, userId }: ProjectSharingProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("view");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [shareType, setShareType] = useState<"user" | "team">("user");

  const queryClient = useQueryClient();

  const { data: shares = [] } = useQuery({
    queryKey: [`/api/designs/${design.id}/shares`],
  });

  const { data: teams = [] } = useQuery({
    queryKey: [`/api/teams/user/${userId}`],
  });

  const shareDesignMutation = useMutation({
    mutationFn: async (data: {
      teamId?: number;
      sharedWithUserId?: number;
      permission: string;
      sharedBy: number;
    }) => {
      return await apiRequest(`/api/designs/${design.id}/share`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/designs/${design.id}/shares`] });
      setIsShareDialogOpen(false);
      setShareEmail("");
      setSelectedTeam("");
    },
  });

  const removeShareMutation = useMutation({
    mutationFn: async (shareId: number) => {
      return await apiRequest(`/api/shares/${shareId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/designs/${design.id}/shares`] });
    },
  });

  const handleShare = () => {
    if (shareType === "user" && !shareEmail.trim()) return;
    if (shareType === "team" && !selectedTeam) return;

    const shareData = {
      permission: sharePermission,
      sharedBy: userId,
      ...(shareType === "user" 
        ? { sharedWithUserId: Math.floor(Math.random() * 1000) + 1 } // Mock user lookup
        : { teamId: parseInt(selectedTeam) }
      )
    };

    shareDesignMutation.mutate(shareData);
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'admin': return <Lock className="w-4 h-4 text-red-500" />;
      case 'edit': return <Edit className="w-4 h-4 text-blue-500" />;
      case 'view': return <Eye className="w-4 h-4 text-green-500" />;
      default: return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPermissionBadgeVariant = (permission: string) => {
    switch (permission) {
      case 'admin': return 'destructive';
      case 'edit': return 'default';
      case 'view': return 'secondary';
      default: return 'outline';
    }
  };

  const formatShareTarget = (share: ProjectShare) => {
    if (share.teamId) {
      const team = teams.find((t: Team) => t.id === share.teamId);
      return `Team: ${team?.name || 'Unknown Team'}`;
    }
    return `User: ${share.sharedWithUserId}`;
  };

  return (
    <Card className="result-card rounded-3xl border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Share2 className="text-white w-5 h-5" />
            </div>
            <CardTitle className="text-xl font-sf-pro">Project Sharing</CardTitle>
          </div>
          
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glass-button rounded-xl" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-xl max-w-md">
              <DialogHeader>
                <DialogTitle>Share "{design.name}"</DialogTitle>
              </DialogHeader>
              
              <Tabs value={shareType} onValueChange={(value) => setShareType(value as "user" | "team")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user">Individual</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
                
                <TabsContent value="user" className="space-y-4">
                  <div>
                    <Label htmlFor="shareEmail">Email Address</Label>
                    <Input
                      id="shareEmail"
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="colleague@university.edu"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="team" className="space-y-4">
                  <div>
                    <Label htmlFor="shareTeam">Select Team</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team: Team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div>
                <Label htmlFor="sharePermission">Permission Level</Label>
                <Select value={sharePermission} onValueChange={setSharePermission}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                    <SelectItem value="admin">Full Access</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {sharePermission === 'view' && 'Can view results and export data'}
                  {sharePermission === 'edit' && 'Can modify design parameters and add comments'}
                  {sharePermission === 'admin' && 'Can manage sharing and delete the project'}
                </p>
              </div>
              
              <Button 
                onClick={handleShare} 
                disabled={shareDesignMutation.isPending}
                className="w-full"
              >
                {shareDesignMutation.isPending ? 'Sharing...' : 'Share Project'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {shares.length > 0 ? (
          <div className="space-y-3">
            {shares.map((share: ProjectShare) => (
              <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
                <div className="flex items-center space-x-3">
                  {getPermissionIcon(share.permission)}
                  <div>
                    <p className="font-medium text-gray-800">
                      {formatShareTarget(share)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Shared {new Date(share.sharedAt!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getPermissionBadgeVariant(share.permission)} className="text-xs">
                    {share.permission}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeShareMutation.mutate(share.id)}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Share2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">This project hasn't been shared yet.</p>
            <p className="text-xs">Click "Share" to collaborate with your team.</p>
          </div>
        )}
        
        {/* Quick Share Options */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full text-xs">
              <Mail className="w-3 h-3 mr-1" />
              Email Link
            </Button>
            <Button variant="outline" size="sm" className="rounded-full text-xs">
              <Users className="w-3 h-3 mr-1" />
              Share with Lab
            </Button>
            <Button variant="outline" size="sm" className="rounded-full text-xs">
              <Lock className="w-3 h-3 mr-1" />
              Public Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}