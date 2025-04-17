import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Mail, Phone, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { NewClientContact, insertNewClientContactSchema, Client } from "@shared/schema";
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

export default function Contacts() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<NewClientContact | null>(null);
  const [contactToConvert, setContactToConvert] = useState<NewClientContact | null>(null);

  // Form setup
  const form = useForm({
    resolver: zodResolver(insertNewClientContactSchema),
    defaultValues: {
      contactName: "",
      phoneEmail: "",
      contactedDate: new Date().toISOString().split('T')[0],
      contactMethod: "Phone",
      responseType: "No Response",
      notes: "",
      convertedToClient: false,
      convertedClientId: undefined,
    },
  });

  // Convert form setup
  const convertForm = useForm({
    defaultValues: {
      clientId: 0,
    },
  });

  // Reset form when dialog opens/closes or when editing contact changes
  React.useEffect(() => {
    if (dialogOpen && editingContact) {
      form.reset({
        ...editingContact,
        contactedDate: editingContact.contactedDate,
      });
    } else if (dialogOpen) {
      form.reset({
        contactName: "",
        phoneEmail: "",
        contactedDate: new Date().toISOString().split('T')[0],
        contactMethod: "Phone",
        responseType: "No Response",
        notes: "",
        convertedToClient: false,
        convertedClientId: undefined,
      });
    }
  }, [dialogOpen, editingContact, form]);

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/contacts'],
  });

  // Fetch clients for dropdown
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const response = await apiRequest('POST', '/api/contacts', data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact created",
        description: "New contact has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form.getValues }) => {
      const response = await apiRequest('PUT', `/api/contacts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingContact(null);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact updated",
        description: "Contact has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convert contact to client mutation
  const convertContactMutation = useMutation({
    mutationFn: async ({ contactId, clientId }: { contactId: number; clientId: number }) => {
      const response = await apiRequest('POST', `/api/contacts/${contactId}/convert`, { clientId });
      return response.json();
    },
    onSuccess: () => {
      setConvertDialogOpen(false);
      setContactToConvert(null);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact converted",
        description: "Contact has been converted to client successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error converting contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: typeof form.getValues) => {
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, data });
    } else {
      createContactMutation.mutate(data);
    }
  };

  const handleConvertSubmit = (data: { clientId: number }) => {
    if (contactToConvert) {
      convertContactMutation.mutate({ 
        contactId: contactToConvert.id, 
        clientId: data.clientId 
      });
    }
  };

  const getResponseTypeBadgeVariant = (responseType: string) => {
    switch (responseType) {
      case 'Positive':
        return 'success';
      case 'Negative':
        return 'danger';
      case 'No Response':
        return 'warning';
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

  const columns = [
    {
      id: "contactName",
      header: "Contact Name",
      cell: (contact: NewClientContact) => <span className="font-medium">{contact.contactName}</span>,
      sortable: true,
    },
    {
      id: "phoneEmail",
      header: "Phone / Email",
      cell: (contact: NewClientContact) => contact.phoneEmail,
      sortable: true,
    },
    {
      id: "contactedDate",
      header: "Contacted Date",
      cell: (contact: NewClientContact) => formatDate(contact.contactedDate),
      sortable: true,
    },
    {
      id: "contactMethod",
      header: "Contact Method",
      cell: (contact: NewClientContact) => (
        <div className="flex items-center gap-1">
          {contact.contactMethod === "Phone" ? (
            <Phone className="h-3 w-3" />
          ) : contact.contactMethod === "Email" ? (
            <Mail className="h-3 w-3" />
          ) : (
            <span>👤</span>
          )}
          <span>{contact.contactMethod}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: "responseType",
      header: "Response",
      cell: (contact: NewClientContact) => (
        <Badge variant={getResponseTypeBadgeVariant(contact.responseType)}>
          {contact.responseType}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "convertedToClient",
      header: "Converted",
      cell: (contact: NewClientContact) => (
        contact.convertedToClient ? (
          <Badge variant="success">Yes</Badge>
        ) : (
          <Badge variant="outline">No</Badge>
        )
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (contact: NewClientContact) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            setEditingContact(contact);
            setDialogOpen(true);
          }}>
            Edit
          </Button>
          {!contact.convertedToClient && (
            <Button variant="outline" size="sm" onClick={() => {
              setContactToConvert(contact);
              setConvertDialogOpen(true);
            }}>
              <ArrowRight className="h-3 w-3 mr-1" /> Convert
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Client Contacts</h2>
          <p className="text-muted-foreground">Manage potential client leads and contacts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contacts List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={contacts}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search contacts..."
            pagination={true}
            loading={contactsLoading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>
              {editingContact ? 'Update contact details below' : 'Enter contact details below'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone / Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number or email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Contacted Date</FormLabel>
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Method</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="In-person">In-person</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="responseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select response" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Positive">Positive</SelectItem>
                          <SelectItem value="Negative">Negative</SelectItem>
                          <SelectItem value="No Response">No Response</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
                <Button type="submit" disabled={createContactMutation.isPending || updateContactMutation.isPending}>
                  {createContactMutation.isPending || updateContactMutation.isPending 
                    ? 'Saving...' 
                    : editingContact ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Convert Contact Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Contact to Client</DialogTitle>
            <DialogDescription>
              Select an existing client to associate with this contact.
            </DialogDescription>
          </DialogHeader>
          <Form {...convertForm}>
            <form onSubmit={convertForm.handleSubmit(handleConvertSubmit)} className="space-y-4">
              <FormField
                control={convertForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Client</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setConvertDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={convertContactMutation.isPending}>
                  {convertContactMutation.isPending ? 'Converting...' : 'Convert Contact'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
