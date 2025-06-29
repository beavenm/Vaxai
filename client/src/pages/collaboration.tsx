import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Share2, MessageCircle, Clock, TrendingUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamManagement from "@/components/TeamManagement";
import type { VaccineDesign, Team } from "@shared/schema";

export default function CollaborationPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const mockUserId = 1; // In a real app, this would come from authentication

  const { data: myProjects = [] } = useQuery({
    queryKey: [`/api/vaccine-designs`],
  });

  const { data: sharedProjects = [] } = useQuery({
    queryKey: [`/api/users/${mockUserId}/shared-designs`],
  });

  const { data: teams = [] } = useQuery({
    queryKey: [`/api/teams/user/${mockUserId}`],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <section className="animate-fade-in">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl mb-6 animate-bounce-gentle">
            <Users className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-sf-pro font-bold text-gray-800 mb-4">Team Collaboration</h1>
          <p className="text-xl text-gray-600">Manage teams, share projects, and collaborate on vaccine research</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 glass-card rounded-2xl p-2">
            <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
            <TabsTrigger value="teams" className="rounded-xl">Teams</TabsTrigger>
            <TabsTrigger value="shared" className="rounded-xl">Shared Projects</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-xl">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
              <Card className="result-card rounded-2xl border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="text-blue-500 w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{teams.length}</div>
                  <div className="text-sm text-gray-600">Active Teams</div>
                </CardContent>
              </Card>
              
              <Card className="result-card rounded-2xl border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Share2 className="text-green-500 w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{sharedProjects.length}</div>
                  <div className="text-sm text-gray-600">Shared Projects</div>
                </CardContent>
              </Card>
              
              <Card className="result-card rounded-2xl border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="text-purple-500 w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">24</div>
                  <div className="text-sm text-gray-600">Recent Comments</div>
                </CardContent>
              </Card>
              
              <Card className="result-card rounded-2xl border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="text-orange-500 w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">89%</div>
                  <div className="text-sm text-gray-600">Team Efficiency</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Projects */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="result-card rounded-3xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>My Recent Projects</span>
                    <Button variant="ghost" size="sm">View All</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myProjects.slice(0, 3).map((project: VaccineDesign) => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
                          <div>
                            <p className="font-medium text-gray-800">{project.name}</p>
                            <p className="text-sm text-gray-600">{project.vaccineType}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                    {myProjects.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No projects yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="result-card rounded-3xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Team Activity</span>
                    <Button variant="ghost" size="sm">View All</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50/70 rounded-xl">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">New comment on COVID-19 Variant Design</p>
                        <p className="text-xs text-gray-600">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50/70 rounded-xl">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Share2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Project shared with Virology Team</p>
                        <p className="text-xs text-gray-600">5 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50/70 rounded-xl">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">New member joined Research Lab Team</p>
                        <p className="text-xs text-gray-600">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement userId={mockUserId} />
          </TabsContent>

          <TabsContent value="shared" className="space-y-6">
            <Card className="result-card rounded-3xl border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Shared Projects</CardTitle>
                  <Badge variant="outline">{sharedProjects.length} projects</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {sharedProjects.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {sharedProjects.map((project: VaccineDesign) => (
                      <div key={project.id} className="p-4 bg-gray-50/70 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{project.name}</h4>
                          <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{project.vaccineType}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Shared {new Date(project.createdAt!).toLocaleDateString()}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-blue-500">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Share2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No shared projects yet.</p>
                    <p className="text-sm">Projects shared with you will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="result-card rounded-3xl border-0">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Activity timeline would go here */}
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Activity feed coming soon.</p>
                    <p className="text-sm">Track team collaboration and project updates here.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </section>
  );
}