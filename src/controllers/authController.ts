import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/dotenv";

export default class AuthController {
    async login(req: Request, res: Response) {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                data: {
                    success: false,
                    message: "Please provide both a username and a password",
                },
            });
        }

        try {
            const user = await User.findOne({
                username: req.body.username,
            });

            if (!user) {
                return res.status(404).json({
                    data: { success: false, message: "User not found" },
                });
            }

            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (!passwordIsValid) {
                return res.status(401).json({
                    data: {
                        success: false,
                        message: "Invalid credentials",
                    },
                });
            }

            const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
                algorithm: "HS256",
                expiresIn: 86400,
            });

            if (!req.session) {
                return res.status(500).json({
                    success: false,
                    message: "Error accessing session",
                });
            }
            req.session.token = token;

            return res.status(200).json({
                data: {
                    success: true,
                    user: {
                        username: user.username,
                        email: user.email,
                    },
                },
            });
        } catch (e: any) {
            console.log(e);
        }
    }

    async signUp(req: Request, res: Response) {
        const { username, email, password } = req.body;
        console.log(req);
        console.log(req.body);
        if (!username || !email || !password) {
            return res
                .status(400) // 400 Bad Request
                .json({
                    data: {
                        success: false,
                        error: "Please provide a username, password, and email",
                        message:
                            "Username, password, and/or email not provided",
                    },
                });
        }

        try {
            await User.create({
                username: username,
                email: email,
                password: bcrypt.hashSync(password, 8),
                facebookUserId: null,
                accessToken: null,
                profilePicture: null,
            });

            return res
                .status(201) // 201 Created
                .json({
                    data: {
                        success: true,
                        message: "User successfully registered",
                    },
                });
        } catch (e: any) {
            console.log(e);
            return res.status(500).json({
                data: {
                    success: false,
                    error: e,
                    message: "Internal server error",
                },
            }); // 500 Internal Server Error
        }
    }

    async logout(req: Request, res: Response) {
        try {
            req.session = null;
            return res.status(200).json({
                data: { success: true, message: "Successfully signed out" },
            });
        } catch (e: any) {
            res.status(500).json({
                data: { success: false, message: `Error sigining out: ${e}` },
            });
        }
    }

    async checkLoginStatus(req: Request, res: Response) {
        if (!req.session || !req.session.token) {
            console.log("No session or session token");
            return res
                .status(401)
                .json({ data: { success: false, message: "Not logged in" } });
        }

        const token = req.session.token;

        jwt.verify(
            token,
            config.JWT_SECRET,
            (err: Error | null, decoded: string | object | undefined) => {
                if (err) {
                    return res.status(401).json({
                        data: { success: false, message: "Not logged in" },
                    });
                }

                (req as any).userId = (decoded as any).id;
                return res.status(200).json({
                    data: { success: true, message: "Already logged in" },
                });
            },
        );
    }
}
