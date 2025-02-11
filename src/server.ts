import app from "./app";
import { config } from "./config/dotenv";
import { connectDB } from "./config/database";

connectDB();

app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});
