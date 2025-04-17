import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, BarChart2, PieChart, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { format, subDays, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";

// Create a simple DatePicker component
const DatePicker = ({ value, onChange }: { value: Date, onChange: (date: Date) => void }) => {
  return (
    <div className="flex items-center border rounded-md">
      <input 
        type="date" 
        value={format(value, "yyyy-MM-dd")} 
        onChange={(e) => onChange(new Date(e.target.value))}
        className="px-3 py-2 rounded-md"
      />
      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
    </div>
  );
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState("pending");
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState("projects");

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Fetch follow-ups
  const { data: followUps = [], isLoading: followUpsLoading } = useQuery({
    queryKey: ['/api/followups'],
  });

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  const isLoading = projectsLoading || followUpsLoading || clientsLoading;

  // Filter data by date range
  const filterByDateRange = (data: any[], dateField: string) => {
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Pending projects
  const pendingProjects = projects.filter(project => project.status === "Pending");
  
  // Pending follow-ups
  const pendingFollowUps = followUps.filter(followUp => followUp.status === "Pending");
  
  // Projects in date range
  const projectsInRange = filterByDateRange(projects, "dateRequested");
  
  // Calculate approval rate
  const sentProjects = projects.filter(project => project.status !== "Pending").length;
  const completedProjects = projects.filter(project => project.status === "Completed").length;
  const approvalRate = sentProjects > 0 ? (completedProjects / sentProjects) * 100 : 0;

  // Data for project status chart
  const projectStatusData = [
    { name: 'Pending', value: projects.filter(p => p.status === 'Pending').length },
    { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length },
  ];

  // Colors for pie chart
  const COLORS = ['#FFBB28', '#0088FE', '#00C49F'];

  // Data for monthly revenue chart
  const getMonthlyRevenueData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, 'MMM'),
        revenue: 0,
      });
    }

    projects.forEach(project => {
      const projectDate = new Date(project.dateRequested);
      const monthIndex = months.findIndex(m => m.month === format(projectDate, 'MMM'));
      if (monthIndex !== -1) {
        months[monthIndex].revenue += project.price;
      }
    });

    return months;
  };

  const monthlyRevenueData = getMonthlyRevenueData();

  // Table columns for different report types
  const pendingProjectsColumns = [
    {
      id: "name",
      header: "Project Name",
      cell: (project: any) => <span className="font-medium">{project.name}</span>,
      sortable: true,
    },
    {
      id: "clientId",
      header: "Client",
      cell: (project: any) => {
        const client = clients.find(c => c.id === project.clientId);
        return client ? client.name : `Client ${project.clientId}`;
      },
      sortable: true,
    },
    {
      id: "dateRequested",
      header: "Date Requested",
      cell: (project: any) => format(new Date(project.dateRequested), "MMM dd, yyyy"),
      sortable: true,
    },
    {
      id: "price",
      header: "Price",
      cell: (project: any) => `$${project.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sortable: true,
    },
  ];

  const pendingFollowUpsColumns = [
    {
      id: "taskDescription",
      header: "Task",
      cell: (followUp: any) => <span className="font-medium">{followUp.taskDescription}</span>,
      sortable: true,
    },
    {
      id: "clientId",
      header: "Client",
      cell: (followUp: any) => {
        if (!followUp.clientId) return "N/A";
        const client = clients.find(c => c.id === followUp.clientId);
        return client ? client.name : `Client ${followUp.clientId}`;
      },
      sortable: true,
    },
    {
      id: "dueDate",
      header: "Due Date",
      cell: (followUp: any) => format(new Date(followUp.dueDate), "MMM dd, yyyy"),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (followUp: any) => {
        const isOverdue = new Date(followUp.dueDate) < new Date();
        return (
          <Badge variant={isOverdue ? "danger" : "warning"}>
            {isOverdue ? "Overdue" : "Pending"}
          </Badge>
        );
      },
      sortable: true,
    },
  ];

  const completedProjectsColumns = [
    {
      id: "name",
      header: "Project Name",
      cell: (project: any) => <span className="font-medium">{project.name}</span>,
      sortable: true,
    },
    {
      id: "clientId",
      header: "Client",
      cell: (project: any) => {
        const client = clients.find(c => c.id === project.clientId);
        return client ? client.name : `Client ${project.clientId}`;
      },
      sortable: true,
    },
    {
      id: "dateOfExecution",
      header: "Completion Date",
      cell: (project: any) => project.dateOfExecution ? format(new Date(project.dateOfExecution), "MMM dd, yyyy") : "N/A",
      sortable: true,
    },
    {
      id: "price",
      header: "Revenue",
      cell: (project: any) => `$${project.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sortable: true,
    },
  ];

  const handleExportReport = () => {
    // In a real implementation, this would generate and download a CSV or PDF file
    alert("Report export functionality would be implemented here.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">View detailed reports and analytics of your business.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {clients.filter(c => c.clientType === "Company").length} companies, {clients.filter(c => c.clientType === "Private").length} individuals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingProjects.length} pending, {projects.filter(p => p.status === "In Progress").length} in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedProjects} completed out of {sentProjects} sent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.reduce((sum, p) => sum + p.price, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              From {projects.length} projects
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Projects']} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <CardTitle>Detailed Reports</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="follow-ups">Follow-ups</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <DatePicker value={startDate} onChange={setStartDate} />
                <span>to</span>
                <DatePicker value={endDate} onChange={setEndDate} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              {reportType === "projects" ? (
                <DataTable
                  data={pendingProjects}
                  columns={pendingProjectsColumns}
                  searchable={true}
                  searchPlaceholder="Search pending projects..."
                  pagination={true}
                />
              ) : reportType === "follow-ups" ? (
                <DataTable
                  data={pendingFollowUps}
                  columns={pendingFollowUpsColumns}
                  searchable={true}
                  searchPlaceholder="Search pending follow-ups..."
                  pagination={true}
                />
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  No pending data available for this report type.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {reportType === "projects" ? (
                <DataTable
                  data={projects.filter(p => p.status === "Completed")}
                  columns={completedProjectsColumns}
                  searchable={true}
                  searchPlaceholder="Search completed projects..."
                  pagination={true}
                />
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  No completed data available for this report type.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {reportType === "projects" ? (
                <DataTable
                  data={projectsInRange}
                  columns={[
                    ...completedProjectsColumns,
                    {
                      id: "status",
                      header: "Status",
                      cell: (project: any) => (
                        <Badge 
                          variant={
                            project.status === "Pending" ? "warning" : 
                            project.status === "In Progress" ? "info" : 
                            "success"
                          }
                        >
                          {project.status}
                        </Badge>
                      ),
                      sortable: true,
                    }
                  ]}
                  searchable={true}
                  searchPlaceholder="Search projects..."
                  pagination={true}
                />
              ) : reportType === "follow-ups" ? (
                <DataTable
                  data={filterByDateRange(followUps, "dueDate")}
                  columns={[
                    ...pendingFollowUpsColumns,
                    {
                      id: "assignedEmployeeId",
                      header: "Assigned To",
                      cell: (followUp: any) => `Employee ${followUp.assignedEmployeeId}`,
                      sortable: true,
                    }
                  ]}
                  searchable={true}
                  searchPlaceholder="Search follow-ups..."
                  pagination={true}
                />
              ) : (
                <DataTable
                  data={clients}
                  columns={[
                    {
                      id: "name",
                      header: "Client Name",
                      cell: (client: any) => <span className="font-medium">{client.name}</span>,
                      sortable: true,
                    },
                    {
                      id: "phone",
                      header: "Phone",
                      cell: (client: any) => client.phone,
                      sortable: true,
                    },
                    {
                      id: "clientType",
                      header: "Type",
                      cell: (client: any) => (
                        <Badge variant={client.clientType === "Company" ? "info" : "success"}>
                          {client.clientType}
                        </Badge>
                      ),
                      sortable: true,
                    },
                    {
                      id: "projects",
                      header: "Projects",
                      cell: (client: any) => {
                        const clientProjects = projects.filter(p => p.clientId === client.id);
                        return clientProjects.length;
                      },
                      sortable: true,
                    },
                    {
                      id: "totalRevenue",
                      header: "Total Revenue",
                      cell: (client: any) => {
                        const revenue = projects
                          .filter(p => p.clientId === client.id)
                          .reduce((sum, p) => sum + p.price, 0);
                        return `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      },
                      sortable: true,
                    },
                  ]}
                  searchable={true}
                  searchPlaceholder="Search clients..."
                  pagination={true}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
