import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FollowUp, insertFollowUpSchema, Client, Employee } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";

export default function FollowUps() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Form setup
  const form = useForm({
    resolver: zodResolver(insertFollowUpSchema),
    defaultValues: {
      taskDescription: "",
      clientId: undefined,
      relatedProjectId: undefined,
      assignedEmployeeId: 1,
      dueDate: new Date().toISOString().split('T')[0],
      status: "Pending",
      notes: "",
      createdById: user?.id || 1,
    },
  });

  // Reset form when dialog opens/closes or when editing follow-up changes
  React.useEffect(() => {
    if (dialogOpen && editingFollowUp) {
      form.reset({
        ...editingFollowUp,
        dueDate: editingFollowUp.dueDate,
      });
    } else if (dialogOpen) {
      form.reset({
        taskDescription: "",
        clientId: undefined,
        relatedProjectId: undefined,
        assignedEmployeeId: 1,
        dueDate: new Date().toISOString().split('T')[0],
        status: "Pending",
        notes: "",
        createdById: user?.id || 1,
      });
    }
  }, [dialogOpen, editingFollowUp, form, user]);

  // Fetch follow-ups with status filter if applicable
  const { data: followUps = [], isLoading: followUpsLoading } = useQuery({
    queryKey: ['/api/followups', statusFilter],
    queryFn: async ({ queryKey }) => {
      const status = queryKey[1];
      const url = status ? `/api/followups?status=${status}` : '/api/followups';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch follow-ups');
      return res.json();
    },
  });

  // Fetch clients for dropdown
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Fetch employees for dropdown
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch projects for dropdown
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Create follow-up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const response = await apiRequest('POST', '/api/followups', data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/followups'] });
      toast({
        title: "Follow-up created",
        description: "New follow-up task has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating follow-up",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update follow-up mutation
  const updateFollowUpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form.getValues }) => {
      const response = await apiRequest('PUT', `/api/followups/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingFollowUp(null);
      queryClient.invalidateQueries({ queryKey: ['/api/followups'] });
      toast({
        title: "Follow-up updated",
        description: "Follow-up task has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating follow-up",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Quick status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/followups/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/followups'] });
      toast({
        title: "Status updated",
        description: "Follow-up status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: typeof form.getValues) => {
    // Convert client and project IDs to numbers if they exist
    const formattedData = {
      ...data,
      clientId: data.clientId ? Number(data.clientId) : undefined,
      relatedProjectId: data.relatedProjectId ? Number(data.relatedProjectId) : undefined,
      assignedEmployeeId: Number(data.assignedEmployeeId),
      createdById: Number(data.createdById),
    };

    if (editingFollowUp) {
      updateFollowUpMutation.mutate({ id: editingFollowUp.id, data: formattedData });
    } else {
      createFollowUpMutation.mutate(formattedData);
    }
  };

  const getStatusBadgeVariant = (status: string, dueDate: string) => {
    if (status === "Done") return "success";
    if (status === "Canceled") return "outline";
    
    // Check if overdue
    const isOverdue = new Date(dueDate) < new Date();
    return isOverdue ? "danger" : "warning";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getClientName = (clientId?: number) => {
    if (!clientId) return 'N/A';
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? client.name : `Client ${clientId}`;
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((e: Employee) => e.id === employeeId);
    return employee ? employee.name : `Employee ${employeeId}`;
  };

  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'N/A';
    const project = projects.find((p: any) => p.id === projectId);
    return project ? project.name : `Project ${projectId}`;
  };

  const handleQuickStatusUpdate = (followUp: FollowUp, newStatus: string) => {
    updateStatusMutation.mutate({ id: followUp.id, status: newStatus });
  };

  const columns = [
    {
      id: "taskDescription",
      header: "Task",
      cell: (followUp: FollowUp) => <span className="font-medium">{followUp.taskDescription}</span>,
      sortable: true,
    },
    {
      id: "clientId",
      header: "Client",
      cell: (followUp: FollowUp) => getClientName(followUp.clientId),
      sortable: true,
    },
    {
      id: "dueDate",
      header: "Due Date",
      cell: (followUp: FollowUp) => formatDate(followUp.dueDate),
      sortable: true,
    },
    {
      id: "assignedEmployeeId",
      header: "Assigned To",
      cell: (followUp: FollowUp) => getEmployeeName(followUp.assignedEmployeeId),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (followUp: FollowUp) => (
        <Badge variant={getStatusBadgeVariant(followUp.status, followUp.dueDate)}>
          {followUp.status === "Pending" && new Date(followUp.dueDate) < new Date() 
            ? "Overdue" 
            : followUp.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (followUp: FollowUp) => (
        <div className="flex items-center gap-2">
          {followUp.status === "Pending" && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => handleQuickStatusUpdate(followUp, "Done")}
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => handleQuickStatusUpdate(followUp, "Canceled")}
              >
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setEditingFollowUp(followUp);
              setDialogOpen(true);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Follow-Up Tasks</h2>
          <p className="text-muted-foreground">Manage follow-up tasks and activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-Up
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant={statusFilter === null ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter(null)}
        >
          All
        </Button>
        <Button 
          variant={statusFilter === "Pending" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("Pending")}
        >
          <AlertCircle className="h-4 w-4 mr-1" /> Pending
        </Button>
        <Button 
          variant={statusFilter === "Done" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("Done")}
        >
          <CheckCircle className="h-4 w-4 mr-1" /> Done
        </Button>
        <Button 
          variant={statusFilter === "Canceled" ? "default" : "outline"} 
          size="sm"
          onClick={() => setStatusFilter("Canceled")}
        >
          <XCircle className="h-4 w-4 mr-1" /> Canceled
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={followUps}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search follow-ups..."
            pagination={true}
            loading={followUpsLoading || clientsLoading || employeesLoading || projectsLoading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Follow-Up Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFollowUp ? 'Edit Follow-Up' : 'Add New Follow-Up'}</DialogTitle>
            <DialogDescription>
              {editingFollowUp ? 'Update follow-up task details below' : 'Enter follow-up task details below'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="taskDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Task description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {clients.map((client: Client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="relatedProjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Project (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {projects.map((project: any) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignedEmployeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee: Employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFollowUpMutation.isPending || updateFollowUpMutation.isPending}>
                  {createFollowUpMutation.isPending || updateFollowUpMutation.isPending 
                    ? 'Saving...' 
                    : editingFollowUp ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
