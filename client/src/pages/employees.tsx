import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, UserCheck, UserX, Mail, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Employee, insertEmployeeSchema } from "@shared/schema";
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
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export default function Employees() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Form setup
  const form = useForm({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Technician",
      activeStatus: true,
    },
  });

  // Reset form when dialog opens/closes or when editing employee changes
  React.useEffect(() => {
    if (dialogOpen && editingEmployee) {
      form.reset(editingEmployee);
    } else if (dialogOpen) {
      form.reset({
        name: "",
        email: "",
        role: "Technician",
        activeStatus: true,
      });
    }
  }, [dialogOpen, editingEmployee, form]);

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const response = await apiRequest('POST', '/api/employees', data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Employee created",
        description: "New employee has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form.getValues }) => {
      const response = await apiRequest('PUT', `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Employee updated",
        description: "Employee has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/employees/${id}`);
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Employee deleted",
        description: "Employee has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, activeStatus }: { id: number, activeStatus: boolean }) => {
      const response = await apiRequest('PUT', `/api/employees/${id}`, { activeStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Status updated",
        description: "Employee status has been updated successfully",
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
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleToggleStatus = (employee: Employee) => {
    toggleStatusMutation.mutate({ 
      id: employee.id, 
      activeStatus: !employee.activeStatus 
    });
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployeeMutation.mutate(employeeToDelete.id);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Manager':
        return 'info';
      case 'Sales':
        return 'success';
      case 'Customer Service':
        return 'secondary';
      case 'Technician':
        return 'warning';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      id: "name",
      header: "Name",
      cell: (employee: Employee) => <span className="font-medium">{employee.name}</span>,
      sortable: true,
    },
    {
      id: "email",
      header: "Email",
      cell: (employee: Employee) => (
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3" />
          <span>{employee.email}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: "role",
      header: "Role",
      cell: (employee: Employee) => (
        <Badge variant={getRoleBadgeVariant(employee.role)}>
          {employee.role}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "activeStatus",
      header: "Status",
      cell: (employee: Employee) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={employee.activeStatus}
            onCheckedChange={() => handleToggleStatus(employee)}
          />
          <span className={employee.activeStatus ? "text-green-600" : "text-red-600"}>
            {employee.activeStatus ? "Active" : "Inactive"}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (employee: Employee) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setEditingEmployee(employee);
              setDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDeleteEmployee(employee)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={employees}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search employees..."
            pagination={true}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Update employee details below' : 'Enter employee details below'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Employee name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Customer Service">Customer Service</SelectItem>
                        <SelectItem value="Technician">Technician</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="activeStatus"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Set whether this employee is active or inactive
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}>
                  {createEmployeeMutation.isPending || updateEmployeeMutation.isPending 
                    ? 'Saving...' 
                    : editingEmployee ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the employee "{employeeToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
