import { Router, type Request, type Response } from "express";
import { Booking } from "../models/Booking";
import { requireAuth } from "../middleware/auth";
import type { NewBookingBody, BookingPatchBody } from "../types/index";

export const bookingRouter = Router();

// One line: every route below needs a valid token.
bookingRouter.use(requireAuth);

interface IdParam {
  id: string;
}

// GET /api/bookings -- only this user's bookings, soonest first
bookingRouter.get("/", async (req: Request, res: Response) => {
  const bookings = await Booking.find({ tuteeId: req.userId }).sort({
    scheduledAt: 1,
  });
  res.json(bookings);
});

// GET /api/bookings/:id -- the right row AND the right owner
bookingRouter.get("/:id", async (req: Request<IdParam>, res: Response) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    tuteeId: req.userId,
  });

  if (!booking) {
    res.status(404).json({ message: "No booking with that id" });
    return;
  }

  res.json(booking);
});

// POST /api/bookings -- sessionId and scheduledAt from the body,
// tuteeId from the token, status from the schema default.
bookingRouter.post(
  "/",
  async (
    req: Request<unknown, unknown, NewBookingBody>,
    res: Response,
  ) => {
    const { sessionId, scheduledAt } = req.body;

    const booking = await Booking.create({
      sessionId,
      scheduledAt,
      tuteeId: req.userId,
    });

    res.status(201).json(booking);
  },
);

// PATCH /api/bookings/:id
bookingRouter.patch(
  "/:id",
  async (
    req: Request<IdParam, unknown, BookingPatchBody>,
    res: Response,
  ) => {
    // Pick the allowed fields by name, so a body can never change tuteeId.
    const { sessionId, scheduledAt, status } = req.body;
    const changes = { sessionId, scheduledAt, status };

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, tuteeId: req.userId },
      changes,
      // new: return the row AFTER the change.
      // runValidators: schema rules are skipped on updates otherwise.
      { new: true, runValidators: true },
    );

    if (!booking) {
      res.status(404).json({ message: "No booking with that id" });
      return;
    }

    res.json(booking);
  },
);

// DELETE /api/bookings/:id
bookingRouter.delete("/:id", async (req: Request<IdParam>, res: Response) => {
  const booking = await Booking.findOneAndDelete({
    _id: req.params.id,
    tuteeId: req.userId,
  });

  if (!booking) {
    res.status(404).json({ message: "No booking with that id" });
    return;
  }

  res.status(204).send();
});
