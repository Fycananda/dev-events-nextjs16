import { ObjectId } from "mongodb";

type TMode = "online" | "offline" | "hybrid";

export interface IEvent {
  _id?: ObjectId;
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: TMode;
  audience: string;
  agenda: string;
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
