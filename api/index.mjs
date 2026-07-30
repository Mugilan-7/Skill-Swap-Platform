import { app } from "../server/src/index.js";
import { connectDB } from "../server/src/config/db.js";

let dbReady;

export default async function handler(req, res) {
  dbReady ||= connectDB();
  await dbReady;
  return app(req, res);
}
