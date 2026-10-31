import type { Types } from "mongoose";

// FROM SESSION 1: copied from itelect4-project's src/types/index.ts.
// The schemas in src/models/ are these interfaces again, written a second
// time in a form the database can enforce.

export enum UserRole {
  Tutor = "tutor",
  Tutee = "tutee",
}

export enum BookingStatus {
  Requested = "requested",
  Confirmed = "confirmed",
  Completed = "completed",
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface TutoringSession {
  id: number;
  tutorId: number;
  subject: string;
  ratePerHour: number;
  availableSlots: number;
}

export interface Booking {
  id: number;
  sessionId: number;
  tuteeId: number;
  status: BookingStatus;
  scheduledAt: Date;
}

// ---------------------------------------------------------------------
// What the database actually stores. MongoDB makes its own ids (24-char
// hex), so `id` is dropped and the user reference becomes an ObjectId.
// Both types are DERIVED from the interfaces with Omit (Session 2), so
// Booking stays the single source of truth.
// ---------------------------------------------------------------------

export type UserDoc = Omit<User, "id"> & {
  password: string;
};

// tuteeId is an ObjectId pointing at a User document.
export type BookingDoc = Omit<Booking, "id" | "tuteeId"> & {
  tuteeId: Types.ObjectId;
};

// The body a client sends to create a booking. No id, no status and no
// tuteeId -- the server sets status itself and reads the owner off the
// token. scheduledAt is a string because JSON has no Date.
export type NewBookingBody = Pick<Booking, "sessionId"> & {
  scheduledAt: string;
};

// The only fields PATCH will accept.
export type BookingPatchBody = Partial<NewBookingBody> & {
  status?: BookingStatus;
};
