import FacebookController from "./controllers/facebookController";
import DatabaseService from "./services/dbService";
import FacebookService from "./services/fbService";
import AWSService from "./services/awsService";

const awsService = new AWSService();
const dbService = new DatabaseService(awsService);

const fbService = new FacebookService(dbService);
export const fbController = new FacebookController(fbService);
