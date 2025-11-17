import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - synced with Clerk
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  username: text('username'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Rooms (chat conversations)
export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdById: text('created_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  encryptionKey: text('encryption_key').notNull(), // Stored encrypted key
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdByIdx: index('rooms_created_by_idx').on(table.createdById),
}));

// Room members
export const roomMembers = pgTable('room_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
  isBanned: boolean('is_banned').default(false).notNull(),
}, (table) => ({
  roomIdIdx: index('room_members_room_id_idx').on(table.roomId),
  userIdIdx: index('room_members_user_id_idx').on(table.userId),
}));

// Messages (encrypted content)
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  encryptedContent: text('encrypted_content').notNull(), // E2E encrypted message
  messageType: text('message_type').notNull().default('text'), // 'text' | 'image'
  imageUrl: text('image_url'), // For uploaded images
  metadata: jsonb('metadata'), // For additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  roomIdIdx: index('messages_room_id_idx').on(table.roomId),
  senderIdIdx: index('messages_sender_id_idx').on(table.senderId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
}));

// Todos (the cover application)
export const todos = pgTable('todos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  priority: text('priority').default('medium').notNull(), // 'low' | 'medium' | 'high'
  color: text('color').default('gray'), // Color for the todo card
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('todos_user_id_idx').on(table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdRooms: many(rooms),
  roomMemberships: many(roomMembers),
  messages: many(messages),
  todos: many(todos),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  creator: one(users, {
    fields: [rooms.createdById],
    references: [users.id],
  }),
  members: many(roomMembers),
  messages: many(messages),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomMembers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
}));

