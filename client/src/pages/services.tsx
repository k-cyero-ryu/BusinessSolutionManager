import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Service, insertServiceSchema } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
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

export default function Services() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Form setup
  const form = useForm({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: "Monthly",
      basePrice: 0,
    },
  });

  // Reset form when dialog opens/closes or when editing service changes
  React.useEffect(() => {
    if (dialogOpen && editingService) {
      form.reset(editingService);
    } else if (dialogOpen) {
      form.reset({
        name: "",
        description: "",
        frequency: "Monthly",
        basePrice: 0,
      });
    }
  }, [dialogOpen, editingService, form]);

  // Fetch services
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/services'],
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const response = await apiRequest('POST', '/api/services', data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: "Service created",
        description: "New service has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form.getValues }) => {
      const response = await apiRequest('PUT', `/api/services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingService(null);
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: "Service updated",
        description: "Service has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/services/${id}`);
    },
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: "Service deleted",
        description: "Service has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: typeof form.getValues) => {
    // Convert basePrice to number if it's a string
    const formattedData = {
      ...data,
      basePrice: typeof data.basePrice === 'string' ? parseFloat(data.basePrice) : data.basePrice,
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: formattedData });
    } else {
      createServiceMutation.mutate(formattedData);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete.id);
    }
  };

  const getFrequencyBadgeVariant = (frequency: string) => {
    switch (frequency) {
      case 'Weekly':
        return 'info';
      case 'Monthly':
        return 'success';
      case 'Quarterly':
        return 'warning';
      case 'Annually':
        return 'secondary';
      case 'On-Demand':
        return 'outline';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      id: "name",
      header: "Service Name",
      cell: (service: Service) => <span className="font-medium">{service.name}</span>,
      sortable: true,
    },
    {
      id: "description",
      header: "Description",
      cell: (service: Service) => (
        <span className="truncate max-w-[300px] block">{service.description || "N/A"}</span>
      ),
      sortable: false,
    },
    {
      id: "frequency",
      header: "Frequency",
      cell: (service: Service) => (
        <Badge variant={getFrequencyBadgeVariant(service.frequency)}>
          {service.frequency}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "basePrice",
      header: "Base Price",
      cell: (service: Service) => (
        <span>${service.basePrice.toFixed(2)}</span>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (service: Service) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEditService(service)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteService(service)}>
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
          <h2 className="text-2xl font-bold tracking-tight">Services</h2>
          <p className="text-muted-foreground">Manage your service offerings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={services}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search services..."
            pagination={true}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Update service details below' : 'Enter service details below'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Service name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Service description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Annually">Annually</SelectItem>
                        <SelectItem value="On-Demand">On-Demand</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createServiceMutation.isPending || updateServiceMutation.isPending}>
                  {createServiceMutation.isPending || updateServiceMutation.isPending 
                    ? 'Saving...' 
                    : editingService ? 'Update' : 'Save'}
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
              This will permanently delete the service "{serviceToDelete?.name}". This action cannot be undone.
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
