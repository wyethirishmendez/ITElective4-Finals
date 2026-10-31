import { Schema, model } from "mongoose";
import { BookingStatus, type BookingDoc } from "../types/index";

const bookingSchema = new Schema<BookingDoc>({
  // The owner: the _id of the tutee (a User) who made the booking.
  tuteeId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  // RULE 1 (required + min/max): session ids in this app are whole
  // numbers like 101, so 0, negatives and absurd values are rejected.
  sessionId: {
    type: Number,
    required: [true, "sessionId is required"],
    min: [1, "sessionId must be 1 or higher"],
    max: [999999, "sessionId must be 999999 or lower"],
    validate: {
      validator: Number.isInteger,
      message: "sessionId must be a whole number, like 101",
    },
  },

  // RULE 2 (enum): a booking is only ever in one of the three lifecycle
  // states from Session 1.
  status: {
    type: String,
    enum: {
      values: Object.values(BookingStatus),
      message: "status must be requested, confirmed or completed",
    },
    default: BookingStatus.Requested,
  },

  // RULE 3 (required + custom): same rule the Zod schema enforces in the
  // browser -- a tutoring slot in the past makes no sense to request.
  scheduledAt: {
    type: Date,
    required: [true, "scheduledAt is required"],
    validate: {
      validator: (value: Date) => value.getTime() > Date.now(),
      message: "scheduledAt must be a date and time that hasn't passed yet",
    },
  },
});

// _id becomes id, so the frontend keeps reading .id.
bookingSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Booking = model<BookingDoc>("Booking", bookingSchema);
