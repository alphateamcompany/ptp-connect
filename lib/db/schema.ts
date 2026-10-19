import { pgTable, serial, varchar, integer, numeric, timestamp, text, boolean } from "drizzle-orm/pg-core";

export const generators = pgTable("generators", {
  id: serial("id").primaryKey(),
  generatorId: varchar("generator_id", { length: 50 }).notNull().unique(),
  assetId: varchar("asset_id", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  model: varchar("model", { length: 255 }).notNull(),
  capacityKva: numeric("capacity_kva", { precision: 8, scale: 2 }).notNull(),
  manufacturingYear: varchar("manufacturing_year", { length: 50 }),
  engineMake: varchar("engine_make", { length: 255 }),
  engineNumber: varchar("engine_number", { length: 100 }),
  alternatorMake: varchar("alternator_make", { length: 255 }),
  alternatorNumber: varchar("alternator_number", { length: 100 }),
  controllerType: varchar("controller_type", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  fuelTankLiters: integer("fuel_tank_liters"),
  purchaseDate: varchar("purchase_date", { length: 50 }),
  purchaseCost: numeric("purchase_cost", { precision: 12, scale: 2 }),
  currentHours: integer("current_hours").default(0),
  location: varchar("location", { length: 255 }),
  driveLink: text("drive_link"),
  status: varchar("status", { length: 50 }).notNull().default("Available"),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rentals = pgTable("rentals", {
  id: serial("id").primaryKey(),
  generatorId: integer("generator_id")
    .references(() => generators.id)
    .notNull(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Generator = typeof generators.$inferSelect;
export type NewGenerator = typeof generators.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  gstNumber: varchar("gst_number", { length: 50 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  phone: text("phone"),
  email: varchar("email", { length: 255 }),
  paymentTerms: varchar("payment_terms", { length: 100 }).default("Cash"),
  outstandingAmount: numeric("outstanding_amount", { precision: 12, scale: 2 }).default("0"),
  billingAddress: text("billing_address"),
  siteAddress: text("site_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export const rentalOrders = pgTable("rental_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  billingCompany: varchar("billing_company", { length: 255 }),
  siteLocation: varchar("site_location", { length: 255 }),
  generatorId: integer("generator_id").references(() => generators.id, { onDelete: "set null" }),
  generatorName: varchar("generator_name", { length: 255 }).notNull(),
  generatorKva: varchar("generator_kva", { length: 50 }),
  startDate: varchar("start_date", { length: 50 }).notNull(),
  endDate: varchar("end_date", { length: 50 }).notNull(),
  rentalType: varchar("rental_type", { length: 50 }).notNull().default("Monthly"),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }).notNull(),
  transportCharges: numeric("transport_charges", { precision: 10, scale: 2 }).default("0"),
  securityDeposit: numeric("security_deposit", { precision: 10, scale: 2 }).default("0"),
  dieselIncluded: boolean("diesel_included").default(false).notNull(),
  operatorIncluded: boolean("operator_included").default(false).notNull(),
  rentalCharge: numeric("rental_charge", { precision: 12, scale: 2 }).notNull(),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).default("18"),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type RentalOrder = typeof rentalOrders.$inferSelect;
export type NewRentalOrder = typeof rentalOrders.$inferInsert;

export const dispatches = pgTable("dispatches", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => rentalOrders.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  generatorName: varchar("generator_name", { length: 255 }).notNull(),
  dispatchDate: varchar("dispatch_date", { length: 50 }).notNull(),
  dispatchTime: varchar("dispatch_time", { length: 50 }),
  driverName: varchar("driver_name", { length: 255 }).notNull(),
  vehicleNumber: varchar("vehicle_number", { length: 100 }).notNull(),
  hoursBeforeDispatch: integer("hours_before_dispatch").default(0),
  fuelFilled: integer("fuel_filled").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Dispatch = typeof dispatches.$inferSelect;
export type NewDispatch = typeof dispatches.$inferInsert;

export const siteLogs = pgTable("site_logs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => rentalOrders.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  generatorName: varchar("generator_name", { length: 255 }).notNull(),
  logDate: varchar("log_date", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }),
  runningHours: integer("running_hours").default(0).notNull(),
  dieselFilled: integer("diesel_filled").default(0).notNull(),
  dieselBalance: integer("diesel_balance").default(0).notNull(),
  operatorRemarks: text("operator_remarks"),
  breakdownReport: text("breakdown_report"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SiteLog = typeof siteLogs.$inferSelect;
export type NewSiteLog = typeof siteLogs.$inferInsert;

export const maintenanceRecords = pgTable("maintenance_records", {
  id: serial("id").primaryKey(),
  generatorId: integer("generator_id").references(() => generators.id, { onDelete: "set null" }),
  generatorName: varchar("generator_name", { length: 255 }).notNull(),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  serviceDate: varchar("service_date", { length: 50 }).notNull(),
  technician: varchar("technician", { length: 255 }),
  cost: numeric("cost", { precision: 12, scale: 2 }).default("0").notNull(),
  hoursAtService: integer("hours_at_service").default(0).notNull(),
  nextServiceHours: integer("next_service_hours").default(0).notNull(),
  notes: text("notes"),
  markAvailable: boolean("mark_available").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  returnNumber: varchar("return_number", { length: 50 }).notNull().unique(),
  orderId: integer("order_id").references(() => rentalOrders.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  generatorId: integer("generator_id").references(() => generators.id, { onDelete: "set null" }),
  generatorCode: varchar("generator_code", { length: 100 }).notNull(),
  generatorCapacity: varchar("generator_capacity", { length: 50 }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  siteLocation: varchar("site_location", { length: 255 }).notNull(),
  // Dispatch / Start details
  startDate: varchar("start_date", { length: 50 }),
  startingHours: integer("starting_hours").default(0),
  driverName: varchar("driver_name", { length: 255 }),
  vehicleNumber: varchar("vehicle_number", { length: 100 }),
  // Return / Closing details
  returnDate: varchar("return_date", { length: 50 }).notNull(),
  closingDate: varchar("closing_date", { length: 50 }),
  closingHours: integer("closing_hours").default(0).notNull(),
  returnDriverName: varchar("return_driver_name", { length: 255 }),
  returnVehicleNumber: varchar("return_vehicle_number", { length: 100 }),
  status: varchar("status", { length: 50 }).default("Completed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ReturnRecord = typeof returns.$inferSelect;
export type NewReturnRecord = typeof returns.$inferInsert;
export type TransportRecord = ReturnRecord;
export type NewTransportRecord = NewReturnRecord;
export const transports = returns;

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  partNumber: varchar("part_number", { length: 100 }).notNull().unique(),
  partName: varchar("part_name", { length: 255 }).notNull(),
  model: varchar("model", { length: 255 }),
  category: varchar("category", { length: 100 }).default("General").notNull(),
  compatibleGenerator: varchar("compatible_generator", { length: 255 }).notNull(),
  qtyAvailable: integer("qty_available").default(0).notNull(),
  reorderLevel: integer("reorder_level").default(10).notNull(),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  location: varchar("location", { length: 255 }).default("Chennai Main Warehouse").notNull(),
  status: varchar("status", { length: 50 }).default("In Stock").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = typeof inventory.$inferInsert;

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  orderId: integer("order_id").references(() => rentalOrders.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number", { length: 50 }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerGst: varchar("customer_gst", { length: 50 }),
  issueDate: varchar("issue_date", { length: 50 }).notNull(),
  dueDate: varchar("due_date", { length: 50 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  transportCharges: numeric("transport_charges", { precision: 10, scale: 2 }).default("0").notNull(),
  additionalCharges: numeric("additional_charges", { precision: 10, scale: 2 }).default("0").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  balanceAmount: numeric("balance_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("Pending").notNull(),
  paymentTerms: varchar("payment_terms", { length: 100 }).default("Net 30"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull().unique(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: varchar("payment_date", { length: 50 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 100 }),
  status: varchar("status", { length: 50 }).default("Completed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseNumber: varchar("expense_number", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  generatorId: integer("generator_id").references(() => generators.id, { onDelete: "set null" }),
  generatorName: varchar("generator_name", { length: 255 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: varchar("expense_date", { length: 50 }).notNull(),
  vendor: varchar("vendor", { length: 255 }),
  paymentMethod: varchar("payment_method", { length: 50 }).default("Bank Transfer").notNull(),
  status: varchar("status", { length: 50 }).default("Paid").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;


