import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Eye, FileText, Users, Folder, CheckCircle, DollarSign, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Client, Project, FollowUp } from "@shared/schema";
import { useLocation } from "wouter";
import AnalyticsCard from "@/components/dashboard/analytics-card";
import DashboardChart from "@/components/dashboard/dashboard-chart";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  // Fetch dashboard analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Navigate to create client/project pages
  const handleNewClient = () => setLocation("/clients?new=true");
  const handleNewProject = () => setLocation("/projects?new=true");

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back. Here's an overview of your business.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleNewClient}>
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Button>
          <Button variant="outline" onClick={handleNewProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard 
          title="Total Clients"
          value={analytics?.totalClients || 0}
          icon={<Users className="h-4 w-4 text-primary" />}
          description="+12% from last month"
        />
        
        <AnalyticsCard 
          title="Active Projects"
          value={analytics?.activeProjects || 0}
          icon={<Folder className="h-4 w-4 text-primary" />}
          description="+4 since last week"
        />
        
        <AnalyticsCard 
          title="Pending Follow-Ups"
          value={analytics?.pendingFollowUps || 0}
          icon={<CheckCircle className="h-4 w-4 text-secondary" />}
          description={`${analytics?.overdueFollowUps || 0} overdue`}
          descriptionColor="text-amber-500"
          iconBgColor="bg-secondary/10"
          iconColor="text-secondary"
        />
        
        <AnalyticsCard 
          title="Total Revenue"
          value={`$${analytics?.totalRevenue?.toLocaleString() || 0}`}
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          description="+8% from last month"
          descriptionColor="text-emerald-500"
        />
      </div>
      
      {/* Recent Activity & Tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Follow-Ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <CardTitle className="text-lg font-medium">Pending Follow-Ups</CardTitle>
            <Button variant="link" onClick={() => setLocation("/followups")}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {analytics?.pendingFollowUpsList?.length ? (
              <div className="relative overflow-auto max-h-[280px] scroll-table">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Task</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Due Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {analytics.pendingFollowUpsList.map((followUp: FollowUp) => (
                      <tr key={followUp.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{followUp.taskDescription}</td>
                        <td className="p-4 align-middle">Client {followUp.clientId}</td>
                        <td className="p-4 align-middle">
                          {new Date(followUp.dueDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant={
                              new Date(followUp.dueDate) < new Date() 
                                ? "danger" 
                                : "warning"
                            }
                          >
                            {new Date(followUp.dueDate) < new Date() ? "Overdue" : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No pending follow-ups
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <CardTitle className="text-lg font-medium">Recent Projects</CardTitle>
            <Button variant="link" onClick={() => setLocation("/projects")}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {analytics?.recentProjects?.length ? (
              <div className="relative overflow-auto max-h-[280px] scroll-table">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Project</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {analytics.recentProjects.map((project: Project) => (
                      <tr key={project.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{project.name}</td>
                        <td className="p-4 align-middle">Client {project.clientId}</td>
                        <td className="p-4 align-middle">{new Date(project.dateRequested).toLocaleDateString()}</td>
                        <td className="p-4 align-middle">
                          <Badge 
                            variant={
                              project.status === "Completed" 
                                ? "success" 
                                : project.status === "In Progress" 
                                ? "info" 
                                : "warning"
                            }
                          >
                            {project.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No recent projects
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Monthly
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" size="icon">
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 h-[300px]">
          <DashboardChart />
        </CardContent>
      </Card>
    </section>
  );
}
