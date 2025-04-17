import { pgTable, text, serial, integer, boolean, date, time, timestamp, doublePrecision, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const clientTypeEnum = pgEnum('client_type', ['Private', 'Company']);
export const serviceFrequencyEnum = pgEnum('service_frequency', ['Weekly', 'Monthly', 'Quarterly', 'Annually', 'On-Demand']);
export const projectStatusEnum = pgEnum('project_status', ['Pending', 'In Progress', 'Completed']);
export const contactMethodEnum = pgEnum('contact_method', ['Phone', 'Email', 'In-person']);
export const responseTypeEnum = pgEnum('response_type', ['Positive', 'Negative', 'No Response']);
export const followUpStatusEnum = pgEnum('follow_up_status', ['Pending', 'Done', 'Canceled']);
export const employeeRoleEnum = pgEnum('employee_role', ['Manager', 'Sales', 'Customer Service', 'Technician']);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  employeeId: integer("employee_id"),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  clientType: clientTypeEnum("client_type").notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  frequency: serviceFrequencyEnum("frequency").notNull(),
  basePrice: doublePrecision("base_price").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  name: text("name").notNull(),
  dateRequested: date("date_requested").notNull(),
  dateOfExecution: date("date_of_execution"),
  description: text("description"),
  invoiceFile: text("invoice_file"),
  cost: doublePrecision("cost").notNull(),
  price: doublePrecision("price").notNull(),
  duration: text("duration"),
  status: projectStatusEnum("status").notNull().default("Pending"),
});

export const projectDocuments = pgTable("project_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  uploadDate: timestamp("upload_date").notNull(),
});

export const clientServices = pgTable("client_services", {
  clientId: integer("client_id").notNull(),
  serviceId: integer("service_id").notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.clientId, table.serviceId),
  };
});

export const newClientContacts = pgTable("new_client_contacts", {
  id: serial("id").primaryKey(),
  contactName: text("contact_name").notNull(),
  phoneEmail: text("phone_email").notNull(),
  contactedDate: date("contacted_date").notNull(),
  contactMethod: contactMethodEnum("contact_method").notNull(),
  responseType: responseTypeEnum("response_type").notNull(),
  notes: text("notes"),
  convertedToClient: boolean("converted_to_client").notNull().default(false),
  convertedClientId: integer("converted_client_id"),
});

export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  taskDescription: text("task_description").notNull(),
  clientId: integer("client_id"),
  relatedProjectId: integer("related_project_id"),
  assignedEmployeeId: integer("assigned_employee_id").notNull(),
  dueDate: date("due_date").notNull(),
  status: followUpStatusEnum("status").notNull().default("Pending"),
  notes: text("notes"),
  createdById: integer("created_by_id").notNull(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: employeeRoleEnum("role").notNull(),
  activeStatus: boolean("active_status").notNull().default(true),
});

export const employeeClients = pgTable("employee_clients", {
  employeeId: integer("employee_id").notNull(),
  clientId: integer("client_id").notNull(),
}, (table) => {
  return {
    pk: primaryKey(table.employeeId, table.clientId),
  };
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  employeeId: true,
});

export const insertClientSchema = createInsertSchema(clients);

export const insertServiceSchema = createInsertSchema(services);

export const insertProjectSchema = createInsertSchema(projects);

export const insertProjectDocumentSchema = createInsertSchema(projectDocuments);

export const insertClientServiceSchema = createInsertSchema(clientServices);

export const insertNewClientContactSchema = createInsertSchema(newClientContacts);

export const insertFollowUpSchema = createInsertSchema(followUps);

export const insertEmployeeSchema = createInsertSchema(employees);

export const insertEmployeeClientSchema = createInsertSchema(employeeClients);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectDocument = z.infer<typeof insertProjectDocumentSchema>;
export type ProjectDocument = typeof projectDocuments.$inferSelect;

export type InsertClientService = z.infer<typeof insertClientServiceSchema>;
export type ClientService = typeof clientServices.$inferSelect;

export type InsertNewClientContact = z.infer<typeof insertNewClientContactSchema>;
export type NewClientContact = typeof newClientContacts.$inferSelect;

export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;
export type FollowUp = typeof followUps.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export type InsertEmployeeClient = z.infer<typeof insertEmployeeClientSchema>;
export type EmployeeClient = typeof employeeClients.$inferSelect;
