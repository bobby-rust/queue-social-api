import FacebookController from "./controllers/facebookController";
import DatabaseService from "./services/dbService";
import FacebookService from "./services/fbService";

const dbService = new DatabaseService();

const fbService = new FacebookService(dbService);
export const fbController = new FacebookController(fbService);
