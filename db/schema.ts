import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").unique(),
  avatarUrl: text("avatar_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tournaments table
export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  apiId: text("api_id").notNull().unique(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  teamCount: integer("team_count").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  logo: text("logo"),
  seedingConfig: jsonb("seeding_config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sweepstakes table
export const sweepstakes = pgTable("sweepstakes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  creatorId: uuid("creator_id").notNull().references(() => users.id),
  joinCode: text("join_code").notNull().unique(),
  isPrivate: boolean("is_private").default(false).notNull(),
  maxParticipants: integer("max_participants").notNull(),
  currentParticipants: integer("current_participants").default(0).notNull(),
  drawCompletedAt: timestamp("draw_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tournamentIdx: index("sweepstakes_tournament_idx").on(table.tournamentId),
  creatorIdx: index("sweepstakes_creator_idx").on(table.creatorId),
}));

// Participants table
export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  sweepstakeId: uuid("sweepstake_id").notNull().references(() => sweepstakes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  uniqueParticipant: unique("unique_sweepstake_user").on(table.sweepstakeId, table.userId),
  sweepstakeIdx: index("participants_sweepstake_idx").on(table.sweepstakeId),
  userIdx: index("participants_user_idx").on(table.userId),
}));

// Team Assignments table
export const teamAssignments = pgTable("team_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull(),
  teamName: text("team_name").notNull(),
  teamLogo: text("team_logo"),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => ({
  uniqueAssignment: unique("unique_participant_team").on(table.participantId, table.teamId),
  participantIdx: index("team_assignments_participant_idx").on(table.participantId),
}));

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sweepstakeId: uuid("sweepstake_id").notNull().references(() => sweepstakes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sweepstakeIdx: index("chat_messages_sweepstake_idx").on(table.sweepstakeId),
  createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt),
}));

// Match Cache table
export const matchCache = pgTable("match_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
  apiMatchId: text("api_match_id").notNull().unique(),
  homeTeamId: text("home_team_id").notNull(),
  homeTeamName: text("home_team_name").notNull(),
  awayTeamId: text("away_team_id").notNull(),
  awayTeamName: text("away_team_name").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  rawData: jsonb("raw_data"),
  lastFetchedAt: timestamp("last_fetched_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tournamentIdx: index("match_cache_tournament_idx").on(table.tournamentId),
  statusIdx: index("match_cache_status_idx").on(table.status),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sweepstakes: many(sweepstakes),
  participants: many(participants),
  chatMessages: many(chatMessages),
}));

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  sweepstakes: many(sweepstakes),
  matchCache: many(matchCache),
}));

export const sweepstakesRelations = relations(sweepstakes, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [sweepstakes.tournamentId],
    references: [tournaments.id],
  }),
  creator: one(users, {
    fields: [sweepstakes.creatorId],
    references: [users.id],
  }),
  participants: many(participants),
  chatMessages: many(chatMessages),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  sweepstake: one(sweepstakes, {
    fields: [participants.sweepstakeId],
    references: [sweepstakes.id],
  }),
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
  teamAssignments: many(teamAssignments),
}));

export const teamAssignmentsRelations = relations(teamAssignments, ({ one }) => ({
  participant: one(participants, {
    fields: [teamAssignments.participantId],
    references: [participants.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  sweepstake: one(sweepstakes, {
    fields: [chatMessages.sweepstakeId],
    references: [sweepstakes.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const matchCacheRelations = relations(matchCache, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [matchCache.tournamentId],
    references: [tournaments.id],
  }),
}));
