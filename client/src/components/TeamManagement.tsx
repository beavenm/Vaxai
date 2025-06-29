import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Crown, Shield, Eye, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { Team, TeamMember } from "@shared/schema";

interface TeamManagementProps {
  userId: number;
}

export default function TeamManagement({ userId }: TeamManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: [`/api/teams/user/${userId}`],
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: [`/api/teams/${selectedTeam?.id}/members`],
    enabled: !!selectedTeam,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; createdBy: number }) => {
      return await apiRequest('/api/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/user/${userId}`] });
      setIsCreateDialogOpen(false);
      setNewTeamName("");
      setNewTeamDescription("");
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: { teamId: number; userId: number; role: string }) => {
      return await apiRequest(`/api/teams/${data.teamId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: data.userId, role: data.role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${selectedTeam?.id}/members`] });
      setNewMemberEmail("");
      setNewMemberRole("member");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (data: { teamId: number; userId: number }) => {
      return await apiRequest(`/api/teams/${data.teamId}/members/${data.userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${selectedTeam?.id}/members`] });
    },
  });

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    createTeamMutation.mutate({
      name: newTeamName,
      description: newTeamDescription,
      createdBy: userId,
    });
  };

  const handleAddMember = () => {
    if (!selectedTeam || !newMemberEmail.trim()) return;
    // In a real app, you'd lookup user by email first
    // For demo purposes, using a mock userId
    const mockUserId = Math.floor(Math.random() * 1000) + 1;
    addMemberMutation.mutate({
      teamId: selectedTeam.id,
      userId: mockUserId,
      role: newMemberRole,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'member': return <Users className="w-4 h-4 text-green-500" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="glass-card rounded-3xl p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Users className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-sf-pro font-semibold text-gray-800">Team Management</h2>
            <p className="text-gray-600">Collaborate with your research team</p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="glass-button rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="teamDescription">Description</Label>
                <Textarea
                  id="teamDescription"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Describe your team's purpose"
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleCreateTeam} 
                disabled={createTeamMutation.isPending}
                className="w-full"
              >
                {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Teams List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Teams</h3>
          <div className="space-y-3">
            {teams.map((team: Team) => (
              <Card 
                key={team.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedTeam?.id === team.id ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{team.name}</h4>
                      <p className="text-sm text-gray-600">{team.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {teamMembers.length} members
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {teams.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No teams yet. Create your first team to start collaborating.</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Details */}
        <div>
          {selectedTeam ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/95 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="memberEmail">Email Address</Label>
                        <Input
                          id="memberEmail"
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="colleague@university.edu"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="memberRole">Role</Label>
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleAddMember} 
                        disabled={addMemberMutation.isPending}
                        className="w-full"
                      >
                        {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member: TeamMember) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {getRoleIcon(member.role)}
                      <div>
                        <p className="font-medium text-gray-800">User {member.userId}</p>
                        <p className="text-sm text-gray-600">
                          Joined {new Date(member.joinedAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMemberMutation.mutate({
                            teamId: selectedTeam.id,
                            userId: member.userId
                          })}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a team to view members and manage permissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}