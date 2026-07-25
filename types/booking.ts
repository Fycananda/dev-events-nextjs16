import { ObjectId } from "mongodb";

export interface IBooking {
  _id?: ObjectId;
  eventId: ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}