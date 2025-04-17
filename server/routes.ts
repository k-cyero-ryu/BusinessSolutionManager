import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertClientSchema, insertServiceSchema, insertProjectSchema, insertNewClientContactSchema, insertFollowUpSchema, insertEmployeeSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      await mkdirAsync(uploadsDir, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create uploads directory:', error);
  }

  // Helper function for file uploads
  const handleFileUpload = async (base64Data: string, filename: string): Promise<string> => {
    if (!base64Data) return '';
    
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }
    
    const data = Buffer.from(matches[2], 'base64');
    const filePath = path.join(uploadsDir, filename);
    await writeFileAsync(filePath, data);
    return filePath;
  };

  // Client routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(id, validatedData);
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  app.get("/api/clients/:id/services", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const services = await storage.getServicesByClient(clientId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client services" });
    }
  });

  app.post("/api/clients/:clientId/services/:serviceId", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const serviceId = parseInt(req.params.serviceId);
      
      const client = await storage.getClient(clientId);
      const service = await storage.getService(serviceId);
      
      if (!client || !service) {
        return res.status(404).json({ message: "Client or service not found" });
      }
      
      const clientService = await storage.addServiceToClient({ clientId, serviceId });
      res.status(201).json(clientService);
    } catch (error) {
      res.status(500).json({ message: "Failed to add service to client" });
    }
  });

  app.delete("/api/clients/:clientId/services/:serviceId", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const serviceId = parseInt(req.params.serviceId);
      
      const success = await storage.removeServiceFromClient(clientId, serviceId);
      if (!success) {
        return res.status(404).json({ message: "Client service not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove service from client" });
    }
  });

  // Service routes
  app.get("/api/services", isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const service = await storage.getService(parseInt(req.params.id));
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const updatedService = await storage.updateService(id, validatedData);
      if (!updatedService) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(updatedService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteService(id);
      if (!success) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let projects;
      if (status) {
        projects = await storage.getProjectsByStatus(status);
      } else if (clientId) {
        projects = await storage.getProjectsByClient(clientId);
      } else {
        projects = await storage.getProjects();
      }
      
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const { invoiceFileData, ...projectData } = req.body;
      
      let invoiceFile = '';
      if (invoiceFileData) {
        const filename = `invoice_${Date.now()}.pdf`;
        invoiceFile = await handleFileUpload(invoiceFileData, filename);
      }
      
      const validatedData = insertProjectSchema.parse({
        ...projectData,
        invoiceFile
      });
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { invoiceFileData, ...projectData } = req.body;
      
      let invoiceFile;
      if (invoiceFileData) {
        const filename = `invoice_${Date.now()}.pdf`;
        invoiceFile = await handleFileUpload(invoiceFileData, filename);
        
        // Remove old file if exists
        const existingProject = await storage.getProject(id);
        if (existingProject?.invoiceFile) {
          try {
            await unlinkAsync(existingProject.invoiceFile);
          } catch (error) {
            console.error('Failed to delete old invoice file:', error);
          }
        }
      }
      
      const validatedData = insertProjectSchema.partial().parse({
        ...projectData,
        ...(invoiceFile && { invoiceFile })
      });
      
      const updatedProject = await storage.updateProject(id, validatedData);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get project to check for invoice file
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Delete invoice file if exists
      if (project.invoiceFile) {
        try {
          await unlinkAsync(project.invoiceFile);
        } catch (error) {
          console.error('Failed to delete invoice file:', error);
        }
      }
      
      const success = await storage.deleteProject(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Project documents routes
  app.get("/api/projects/:id/documents", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const documents = await storage.getProjectDocuments(projectId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project documents" });
    }
  });

  app.post("/api/projects/:id/documents", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { fileData, filename } = req.body;
      
      if (!fileData || !filename) {
        return res.status(400).json({ message: "File data and filename are required" });
      }
      
      const savedFilename = `${Date.now()}_${filename}`;
      const filepath = await handleFileUpload(fileData, savedFilename);
      
      const document = await storage.createProjectDocument({
        projectId,
        filename: savedFilename,
        filepath,
        uploadDate: new Date()
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get document to delete file
      const documents = await storage.getProjectDocuments(0); // This is inefficient, but needed for in-memory store
      const document = documents.find(doc => doc.id === id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Delete file
      try {
        await unlinkAsync(document.filepath);
      } catch (error) {
        console.error('Failed to delete document file:', error);
      }
      
      const success = await storage.deleteProjectDocument(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // New client contact routes
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const contacts = await storage.getNewClientContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const contact = await storage.getNewClientContact(parseInt(req.params.id));
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertNewClientContactSchema.parse(req.body);
      const contact = await storage.createNewClientContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertNewClientContactSchema.partial().parse(req.body);
      const updatedContact = await storage.updateNewClientContact(id, validatedData);
      if (!updatedContact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(updatedContact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNewClientContact(id);
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  app.post("/api/contacts/:id/convert", isAuthenticated, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const { clientId } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }
      
      const success = await storage.convertContactToClient(contactId, clientId);
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to convert contact to client" });
    }
  });

  // Follow-up routes
  app.get("/api/followups", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      
      let followUps;
      if (status) {
        followUps = await storage.getFollowUpsByStatus(status);
      } else if (clientId) {
        followUps = await storage.getFollowUpsByClient(clientId);
      } else if (employeeId) {
        followUps = await storage.getFollowUpsByEmployee(employeeId);
      } else {
        followUps = await storage.getFollowUps();
      }
      
      res.json(followUps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  app.get("/api/followups/:id", isAuthenticated, async (req, res) => {
    try {
      const followUp = await storage.getFollowUp(parseInt(req.params.id));
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.json(followUp);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch follow-up" });
    }
  });

  app.post("/api/followups", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertFollowUpSchema.parse(req.body);
      const followUp = await storage.createFollowUp(validatedData);
      res.status(201).json(followUp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });

  app.put("/api/followups/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFollowUpSchema.partial().parse(req.body);
      const updatedFollowUp = await storage.updateFollowUp(id, validatedData);
      if (!updatedFollowUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.json(updatedFollowUp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update follow-up" });
    }
  });

  app.delete("/api/followups/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFollowUp(id);
      if (!success) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete follow-up" });
    }
  });

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      
      let employees;
      if (role) {
        employees = await storage.getEmployeesByRole(role);
      } else {
        employees = await storage.getEmployees();
      }
      
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const employee = await storage.getEmployee(parseInt(req.params.id));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const updatedEmployee = await storage.updateEmployee(id, validatedData);
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(updatedEmployee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Employee-Client assignment routes
  app.post("/api/employees/:employeeId/clients/:clientId", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const clientId = parseInt(req.params.clientId);
      
      const employeeClient = await storage.assignClientToEmployee({ employeeId, clientId });
      res.status(201).json(employeeClient);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign client to employee" });
    }
  });

  app.delete("/api/employees/:employeeId/clients/:clientId", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const clientId = parseInt(req.params.clientId);
      
      const success = await storage.unassignClientFromEmployee(employeeId, clientId);
      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to unassign client from employee" });
    }
  });

  app.get("/api/employees/:id/clients", isAuthenticated, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const clients = await storage.getClientsByEmployee(employeeId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee's clients" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      const projects = await storage.getProjects();
      const followUps = await storage.getFollowUps();
      
      // Calculate some basic analytics
      const totalClients = clients.length;
      
      const activeProjects = projects.filter(p => p.status === 'In Progress').length;
      
      const pendingFollowUps = followUps.filter(f => f.status === 'Pending').length;
      const overdueFollowUps = followUps.filter(f => {
        if (f.status !== 'Pending') return false;
        const dueDate = new Date(f.dueDate);
        return dueDate < new Date();
      }).length;
      
      // Calculate total revenue (sum of all project prices)
      const totalRevenue = projects.reduce((sum, project) => sum + project.price, 0);
      
      // Get recent projects
      const recentProjects = projects
        .sort((a, b) => new Date(b.dateRequested).getTime() - new Date(a.dateRequested).getTime())
        .slice(0, 5);
      
      // Get pending follow-ups
      const pendingFollowUpsList = followUps
        .filter(f => f.status === 'Pending')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);
      
      res.json({
        totalClients,
        activeProjects,
        pendingFollowUps,
        overdueFollowUps,
        totalRevenue,
        recentProjects,
        pendingFollowUpsList
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
