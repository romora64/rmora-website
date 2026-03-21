import {
  mysqlTable,
  varchar,
  int,
  text,
  date,
  time,
  mysqlEnum,
  boolean,
  timestamp,
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  openId: varchar('open_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  loginMethod: varchar('login_method', { length: 50 }).notNull().default('google'),
  role: mysqlEnum('role', ['user', 'admin']).notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp('last_signed_in'),
});

export const admins = mysqlTable('admins', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

export const meetings = mysqlTable('meetings', {
  id: int('id').autoincrement().primaryKey(),
  date: date('date').notNull(),
  time: time('time').notNull(),
  attendeeName: varchar('attendee_name', { length: 255 }).notNull(),
  attendeeEmail: varchar('attendee_email', { length: 255 }).notNull(),
  notes: text('notes'),
  calendarEventId: varchar('calendar_event_id', { length: 255 }),
  meetLink: varchar('meet_link', { length: 500 }),
  status: mysqlEnum('status', ['pending', 'completed', 'cancelled']).notNull().default('pending'),
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const contactMessages = mysqlTable('contact_messages', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  message: text('message').notNull(),
  status: mysqlEnum('status', ['unread', 'read', 'replied', 'archived'])
    .notNull()
    .default('unread'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const availabilityBlocks = mysqlTable('availability_blocks', {
  id: int('id').autoincrement().primaryKey(),
  blockType: mysqlEnum('block_type', ['full_day', 'time_range']).notNull(),
  date: date('date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  reason: varchar('reason', { length: 500 }),
  recurring: mysqlEnum('recurring', ['none', 'weekly', 'daily', 'weekday']).notNull().default('none'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const publications = mysqlTable('publications', {
  id: int('id').autoincrement().primaryKey(),
  type: mysqlEnum('type', ['Artículo', 'Ponencia', 'Investigación', 'Blog']).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  publishedAt: date('published_at').notNull(),
  storageLink: varchar('storage_link', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const licenses = mysqlTable('licenses', {
  code: varchar('code', { length: 50 }).primaryKey(),
  description: text('description').notNull(),
});

export const resources = mysqlTable('resources', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  resourceType: mysqlEnum('resource_type', ['Documento', 'Software', 'Concepto']).notNull(),
  publicationDate: date('publication_date').notNull(),
  description: text('description').notNull(),
  context: text('context'),
  objective: text('objective'),
  license: varchar('license', { length: 50 }).references(() => licenses.code, { onUpdate: 'cascade', onDelete: 'set null' }),
  link: varchar('link', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
export type AvailabilityBlock = typeof availabilityBlocks.$inferSelect;
export type NewAvailabilityBlock = typeof availabilityBlocks.$inferInsert;
export type Publication = typeof publications.$inferSelect;
export type NewPublication = typeof publications.$inferInsert;
export const testimonials = mysqlTable('testimonials', {
  id: int('id').autoincrement().primaryKey(),
  opinion: text('opinion').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  relation: varchar('relation', { length: 100 }).notNull(),
  institution: varchar('institution', { length: 255 }),
  displayOrder: int('display_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;
