import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient,
  services, type Service, type InsertService,
  projects, type Project, type InsertProject,
  projectDocuments, type ProjectDocument, type InsertProjectDocument,
  clientServices, type ClientService, type InsertClientService,
  newClientContacts, type NewClientContact, type InsertNewClientContact,
  followUps, type FollowUp, type InsertFollowUp,
  employees, type Employee, type InsertEmployee,
  employeeClients, type EmployeeClient, type InsertEmployeeClient
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  getClientsByEmployee(employeeId: number): Promise<Client[]>;
  
  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  getServicesByClient(clientId: number): Promise<Service[]>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  
  // ProjectDocument operations
  getProjectDocuments(projectId: number): Promise<ProjectDocument[]>;
  createProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument>;
  deleteProjectDocument(id: number): Promise<boolean>;
  
  // ClientService operations
  getClientServices(clientId: number): Promise<ClientService[]>;
  addServiceToClient(clientService: InsertClientService): Promise<ClientService>;
  removeServiceFromClient(clientId: number, serviceId: number): Promise<boolean>;
  
  // NewClientContact operations
  getNewClientContacts(): Promise<NewClientContact[]>;
  getNewClientContact(id: number): Promise<NewClientContact | undefined>;
  createNewClientContact(contact: InsertNewClientContact): Promise<NewClientContact>;
  updateNewClientContact(id: number, contact: Partial<InsertNewClientContact>): Promise<NewClientContact | undefined>;
  deleteNewClientContact(id: number): Promise<boolean>;
  convertContactToClient(contactId: number, clientId: number): Promise<boolean>;
  
  // FollowUp operations
  getFollowUps(): Promise<FollowUp[]>;
  getFollowUp(id: number): Promise<FollowUp | undefined>;
  createFollowUp(followUp: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: number, followUp: Partial<InsertFollowUp>): Promise<FollowUp | undefined>;
  deleteFollowUp(id: number): Promise<boolean>;
  getFollowUpsByClient(clientId: number): Promise<FollowUp[]>;
  getFollowUpsByEmployee(employeeId: number): Promise<FollowUp[]>;
  getFollowUpsByStatus(status: string): Promise<FollowUp[]>;
  
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  getEmployeesByRole(role: string): Promise<Employee[]>;
  
  // EmployeeClient operations
  assignClientToEmployee(employeeClient: InsertEmployeeClient): Promise<EmployeeClient>;
  unassignClientFromEmployee(employeeId: number, clientId: number): Promise<boolean>;
  getClientsAssignedToEmployee(employeeId: number): Promise<number[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private userStore: Map<number, User>;
  private clientStore: Map<number, Client>;
  private serviceStore: Map<number, Service>;
  private projectStore: Map<number, Project>;
  private projectDocumentStore: Map<number, ProjectDocument>;
  private clientServiceStore: Map<string, ClientService>;
  private newClientContactStore: Map<number, NewClientContact>;
  private followUpStore: Map<number, FollowUp>;
  private employeeStore: Map<number, Employee>;
  private employeeClientStore: Map<string, EmployeeClient>;
  
  private userId: number;
  private clientId: number;
  private serviceId: number;
  private projectId: number;
  private projectDocumentId: number;
  private newClientContactId: number;
  private followUpId: number;
  private employeeId: number;
  
  public sessionStore: session.SessionStore;

  constructor() {
    this.userStore = new Map();
    this.clientStore = new Map();
    this.serviceStore = new Map();
    this.projectStore = new Map();
    this.projectDocumentStore = new Map();
    this.clientServiceStore = new Map();
    this.newClientContactStore = new Map();
    this.followUpStore = new Map();
    this.employeeStore = new Map();
    this.employeeClientStore = new Map();
    
    this.userId = 1;
    this.clientId = 1;
    this.serviceId = 1;
    this.projectId = 1;
    this.projectDocumentId = 1;
    this.newClientContactId = 1;
    this.followUpId = 1;
    this.employeeId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with seed data
    this.seedInitialData();
  }

  private seedInitialData(): void {
    // Create a default manager employee
    this.createEmployee({
      name: "John Doe",
      email: "john@example.com",
      role: "Manager",
      activeStatus: true
    });
    
    // Create admin user linked to the employee
    this.createUser({
      username: "admin",
      password: "password", // This will be hashed during auth setup
      employeeId: 1
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.userStore.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userStore.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.userStore.set(id, newUser);
    return newUser;
  }
  
  // Client methods
  async getClients(): Promise<Client[]> {
    return Array.from(this.clientStore.values());
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    return this.clientStore.get(id);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const newClient: Client = { ...client, id };
    this.clientStore.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clientStore.get(id);
    if (!client) return undefined;
    
    const updatedClient: Client = { ...client, ...clientData };
    this.clientStore.set(id, updatedClient);
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    return this.clientStore.delete(id);
  }
  
  async getClientsByEmployee(employeeId: number): Promise<Client[]> {
    const assignedClientIds = Array.from(this.employeeClientStore.values())
      .filter(ec => ec.employeeId === employeeId)
      .map(ec => ec.clientId);
    
    return Array.from(this.clientStore.values())
      .filter(client => assignedClientIds.includes(client.id));
  }
  
  // Service methods
  async getServices(): Promise<Service[]> {
    return Array.from(this.serviceStore.values());
  }
  
  async getService(id: number): Promise<Service | undefined> {
    return this.serviceStore.get(id);
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceId++;
    const newService: Service = { ...service, id };
    this.serviceStore.set(id, newService);
    return newService;
  }
  
  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.serviceStore.get(id);
    if (!service) return undefined;
    
    const updatedService: Service = { ...service, ...serviceData };
    this.serviceStore.set(id, updatedService);
    return updatedService;
  }
  
  async deleteService(id: number): Promise<boolean> {
    return this.serviceStore.delete(id);
  }
  
  async getServicesByClient(clientId: number): Promise<Service[]> {
    const serviceIds = Array.from(this.clientServiceStore.values())
      .filter(cs => cs.clientId === clientId)
      .map(cs => cs.serviceId);
    
    return Array.from(this.serviceStore.values())
      .filter(service => serviceIds.includes(service.id));
  }
  
  // Project methods
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projectStore.values());
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projectStore.get(id);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const newProject: Project = { ...project, id };
    this.projectStore.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projectStore.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { ...project, ...projectData };
    this.projectStore.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projectStore.delete(id);
  }
  
  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return Array.from(this.projectStore.values())
      .filter(project => project.clientId === clientId);
  }
  
  async getProjectsByStatus(status: string): Promise<Project[]> {
    return Array.from(this.projectStore.values())
      .filter(project => project.status === status);
  }
  
  // ProjectDocument methods
  async getProjectDocuments(projectId: number): Promise<ProjectDocument[]> {
    return Array.from(this.projectDocumentStore.values())
      .filter(doc => doc.projectId === projectId);
  }
  
  async createProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument> {
    const id = this.projectDocumentId++;
    const newDocument: ProjectDocument = { ...document, id };
    this.projectDocumentStore.set(id, newDocument);
    return newDocument;
  }
  
  async deleteProjectDocument(id: number): Promise<boolean> {
    return this.projectDocumentStore.delete(id);
  }
  
  // ClientService methods
  async getClientServices(clientId: number): Promise<ClientService[]> {
    return Array.from(this.clientServiceStore.values())
      .filter(cs => cs.clientId === clientId);
  }
  
  async addServiceToClient(clientService: InsertClientService): Promise<ClientService> {
    const key = `${clientService.clientId}-${clientService.serviceId}`;
    this.clientServiceStore.set(key, clientService);
    return clientService;
  }
  
  async removeServiceFromClient(clientId: number, serviceId: number): Promise<boolean> {
    const key = `${clientId}-${serviceId}`;
    return this.clientServiceStore.delete(key);
  }
  
  // NewClientContact methods
  async getNewClientContacts(): Promise<NewClientContact[]> {
    return Array.from(this.newClientContactStore.values());
  }
  
  async getNewClientContact(id: number): Promise<NewClientContact | undefined> {
    return this.newClientContactStore.get(id);
  }
  
  async createNewClientContact(contact: InsertNewClientContact): Promise<NewClientContact> {
    const id = this.newClientContactId++;
    const newContact: NewClientContact = { ...contact, id };
    this.newClientContactStore.set(id, newContact);
    return newContact;
  }
  
  async updateNewClientContact(id: number, contactData: Partial<InsertNewClientContact>): Promise<NewClientContact | undefined> {
    const contact = this.newClientContactStore.get(id);
    if (!contact) return undefined;
    
    const updatedContact: NewClientContact = { ...contact, ...contactData };
    this.newClientContactStore.set(id, updatedContact);
    return updatedContact;
  }
  
  async deleteNewClientContact(id: number): Promise<boolean> {
    return this.newClientContactStore.delete(id);
  }
  
  async convertContactToClient(contactId: number, clientId: number): Promise<boolean> {
    const contact = this.newClientContactStore.get(contactId);
    if (!contact) return false;
    
    const updatedContact: NewClientContact = { 
      ...contact, 
      convertedToClient: true,
      convertedClientId: clientId
    };
    this.newClientContactStore.set(contactId, updatedContact);
    return true;
  }
  
  // FollowUp methods
  async getFollowUps(): Promise<FollowUp[]> {
    return Array.from(this.followUpStore.values());
  }
  
  async getFollowUp(id: number): Promise<FollowUp | undefined> {
    return this.followUpStore.get(id);
  }
  
  async createFollowUp(followUp: InsertFollowUp): Promise<FollowUp> {
    const id = this.followUpId++;
    const newFollowUp: FollowUp = { ...followUp, id };
    this.followUpStore.set(id, newFollowUp);
    return newFollowUp;
  }
  
  async updateFollowUp(id: number, followUpData: Partial<InsertFollowUp>): Promise<FollowUp | undefined> {
    const followUp = this.followUpStore.get(id);
    if (!followUp) return undefined;
    
    const updatedFollowUp: FollowUp = { ...followUp, ...followUpData };
    this.followUpStore.set(id, updatedFollowUp);
    return updatedFollowUp;
  }
  
  async deleteFollowUp(id: number): Promise<boolean> {
    return this.followUpStore.delete(id);
  }
  
  async getFollowUpsByClient(clientId: number): Promise<FollowUp[]> {
    return Array.from(this.followUpStore.values())
      .filter(followUp => followUp.clientId === clientId);
  }
  
  async getFollowUpsByEmployee(employeeId: number): Promise<FollowUp[]> {
    return Array.from(this.followUpStore.values())
      .filter(followUp => followUp.assignedEmployeeId === employeeId);
  }
  
  async getFollowUpsByStatus(status: string): Promise<FollowUp[]> {
    return Array.from(this.followUpStore.values())
      .filter(followUp => followUp.status === status);
  }
  
  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employeeStore.values());
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employeeStore.get(id);
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeId++;
    const newEmployee: Employee = { ...employee, id };
    this.employeeStore.set(id, newEmployee);
    return newEmployee;
  }
  
  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employeeStore.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee: Employee = { ...employee, ...employeeData };
    this.employeeStore.set(id, updatedEmployee);
    return updatedEmployee;
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    return this.employeeStore.delete(id);
  }
  
  async getEmployeesByRole(role: string): Promise<Employee[]> {
    return Array.from(this.employeeStore.values())
      .filter(employee => employee.role === role);
  }
  
  // EmployeeClient methods
  async assignClientToEmployee(employeeClient: InsertEmployeeClient): Promise<EmployeeClient> {
    const key = `${employeeClient.employeeId}-${employeeClient.clientId}`;
    this.employeeClientStore.set(key, employeeClient);
    return employeeClient;
  }
  
  async unassignClientFromEmployee(employeeId: number, clientId: number): Promise<boolean> {
    const key = `${employeeId}-${clientId}`;
    return this.employeeClientStore.delete(key);
  }
  
  async getClientsAssignedToEmployee(employeeId: number): Promise<number[]> {
    return Array.from(this.employeeClientStore.values())
      .filter(ec => ec.employeeId === employeeId)
      .map(ec => ec.clientId);
  }
}

export const storage = new MemStorage();
