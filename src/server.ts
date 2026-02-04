import express, { Request, Response } from 'express';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connect } from './configs/database.js';
import { routeIndex } from "./routes/index.routes.js";
import path from "path";

config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

connect();
app.use('/api/v1', routeIndex);

// Test Route
app.get("/", (req: Request, res: Response) => {
    res.send('<h1>API is working...</h1>');
});

// Serve uploaded images
app.get("/image/:filename", (req: Request, res: Response): any => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(path.resolve(), "uploads", filename);
        return res.sendFile(filePath);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            data: [],
            message: 'Something went wrong!'
        });
    }
});

// HTTP Server (Temporary)
app.listen(PORT, () => {
    console.log("Server is running at http://localhost:" + PORT);
});
