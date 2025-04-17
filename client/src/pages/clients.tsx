import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, Eye, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Client, insertClientSchema } from "@shared/schema";
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
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Check if URL has new=true query param
  React.useEffect(() => {
    if (location.includes("new=true")) {
      setDialogOpen(true);
      navigate("/clients", { replace: true });
    }
  }, [location, navigate]);

  // Form setup
  const form = useForm({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      clientType: "Private",
    },
  });

  // Reset form when dialog opens/closes or when editing client changes
  React.useEffect(() => {
    if (dialogOpen && editingClient) {
      form.reset(editingClient);
    } else if (dialogOpen) {
      form.reset({
        name: "",
        phone: "",
        address: "",
        clientType: "Private",
      });
    }
  }, [dialogOpen, editingClient, form]);

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const response = await apiRequest('POST', '/api/clients', data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Client created",
        description: "New client has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form.getValues }) => {
      const response = await apiRequest('PUT', `/api/clients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingClient(null);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Client updated",
        description: "Client has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Client deleted",
        description: "Client has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: typeof form.getValues) => {
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, data });
    } else {
      createClientMutation.mutate(data);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const columns = [
    {
      id: "name",
      header: "Name",
      cell: (client: Client) => <span className="font-medium">{client.name}</span>,
      sortable: true,
    },
    {
      id: "phone",
      header: "Phone",
      cell: (client: Client) => client.phone,
      sortable: true,
    },
    {
      id: "clientType",
      header: "Type",
      cell: (client: Client) => (
        <Badge variant={client.clientType === "Company" ? "info" : "success"}>
          {client.clientType}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "address",
      header: "Address",
      cell: (client: Client) => client.address || "N/A",
      sortable: true,
    },
    {
      id: "actions",
      header: "Action",
      cell: (client: Client) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(`/clients/${client.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleEditClient(client)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Manage your client relationships.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <DataTable
        data={clients}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search clients..."
        pagination={true}
        loading={isLoading}
      />

      {/* Add/Edit Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {editingClient ? 'Update client details below' : 'Enter client details below'}
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
                      <Input placeholder="Client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Client address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createClientMutation.isPending || updateClientMutation.isPending}>
                  {createClientMutation.isPending || updateClientMutation.isPending 
                    ? 'Saving...' 
                    : editingClient ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
