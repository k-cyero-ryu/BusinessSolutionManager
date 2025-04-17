import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Eye, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Project, insertProjectSchema } from "@shared/schema";
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
import { FileInput } from "@/components/ui/file-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Projects() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [invoiceFileData, setInvoiceFileData] = useState<string | null>(null);
  
  // Check if URL has new=true query param
  React.useEffect(() => {
    if (location.includes("new=true")) {
      setDialogOpen(true);
      navigate("/projects", { replace: true });
    }
  }, [location, navigate]);

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Fetch clients for dropdown
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Form setup
  const form = useForm({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      clientId: 0,
      name: "",
      dateRequested: new Date().toISOString().split('T')[0],
      dateOfExecution: "",
      description: "",
      cost: 0,
      price: 0,
      duration: "",
      status: "Pending",
      invoiceFile: "",
    },
  });

  // Reset form when dialog opens/closes or when editing project changes
  React.useEffect(() => {
    if (dialogOpen && editingProject) {
      form.reset({
        ...editingProject,
        // Convert date strings to proper format for inputs
        dateRequested: editingProject.dateRequested,
        dateOfExecution: editingProject.dateOfExecution || "",
      });
      setInvoiceFileData(null);
    } else if (dialogOpen) {
      form.reset({
        clientId: 0,
        name: "",
        dateRequested: new Date().toISOString().split('T')[0],
        dateOfExecution: "",
        description: "",
        cost: 0,
        price: 0,
        duration: "",
        status: "Pending",
        invoiceFile: "",
      });
      setInvoiceFileData(null);
    }
  }, [dialogOpen, editingProject, form]);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/projects', {
        ...data,
        invoiceFileData,
      });
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project created",
        description: "New project has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/projects/${id}`, {
        ...data,
        invoiceFileData,
      });
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingProject(null);
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project updated",
        description: "Project has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: typeof form.getValues) => {
    // Convert string values to numbers
    const formattedData = {
      ...data,
      clientId: Number(data.clientId),
      cost: typeof data.cost === 'string' ? parseFloat(data.cost) : data.cost,
      price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
    };

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: formattedData });
    } else {
      createProjectMutation.mutate(formattedData);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'In Progress':
        return 'info';
      case 'Completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? client.name : `Client ${clientId}`;
  };

  const columns = [
    {
      id: "name",
      header: "Project Name",
      cell: (project: Project) => <span className="font-medium">{project.name}</span>,
      sortable: true,
    },
    {
      id: "clientId",
      header: "Client",
      cell: (project: Project) => getClientName(project.clientId),
      sortable: true,
    },
    {
      id: "dateRequested",
      header: "Date Requested",
      cell: (project: Project) => formatDate(project.dateRequested),
      sortable: true,
    },
    {
      id: "dateOfExecution",
      header: "Execution Date",
      cell: (project: Project) => formatDate(project.dateOfExecution || ''),
      sortable: true,
    },
    {
      id: "price",
      header: "Price",
      cell: (project: Project) => `$${project.price.toFixed(2)}`,
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (project: Project) => (
        <Badge variant={getStatusBadgeVariant(project.status)}>
          {project.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (project: Project) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            setEditingProject(project);
            setDialogOpen(true);
          }}>
            <Eye className="h-4 w-4 mr-2" />
            View/Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your project portfolio.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={projects}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search projects..."
            pagination={true}
            loading={projectsLoading || clientsLoading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
            <DialogDescription>
              {editingProject ? 'Update project details below' : 'Enter project details below'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client: any) => (
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
                  name="dateRequested"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date Requested</FormLabel>
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

                <FormField
                  control={form.control}
                  name="dateOfExecution"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Execution</FormLabel>
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

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (Internal)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01" 
                          min="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (Charged to Client)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01" 
                          min="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2 weeks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Project description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice File</FormLabel>
                    <FormControl>
                      <FileInput
                        acceptedFileTypes={['application/pdf']}
                        maxSizeInMB={5}
                        onDataUrlChange={setInvoiceFileData}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending || updateProjectMutation.isPending}>
                  {createProjectMutation.isPending || updateProjectMutation.isPending 
                    ? 'Saving...' 
                    : editingProject ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
