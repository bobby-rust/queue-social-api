import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/dotenv";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
    if (!req.session || !req.session.token) {
        return res.status(403).json({
            data: {
                success: false,
                message: "No token provided",
            },
        });
    }

    const token = req.session.token;

    jwt.verify(
        token,
        config.JWT_SECRET,
        (err: Error | null, decoded: string | object | undefined) => {
            if (err) {
                return res.status(401).json({
                    data: {
                        success: false,
                        message: "Unauthorized",
                    },
                });
            }

            // Why typescript, why
            (req as any).userId = (decoded as any).id;
            next();
        },
    );
}
