import { pgTable, serial, varchar, integer, numeric, timestamp, text } from "drizzle-orm/pg-core";

export const generators = pgTable("generators", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  capacityKva: integer("capacity_kva").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("available"),
  serialNumber: varchar("serial_number", { length: 100 }).unique(),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }),
  currentHours: integer("current_hours").default(0),
  location: varchar("location", { length: 255 }),
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
