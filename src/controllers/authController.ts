import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

export async function login(req: Request, res: Response) {
    console.log(req.body);
    const { username, password } = req.body;
    if (!username || !password) {
        return res
            .status(400)
            .json({ message: "Please provide both a username and a password" });
    }

    try {
        const user = await User.findOne({
            username: req.body.username,
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        return res.status(200).json({
            data: {
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

export async function signUp(req: Request, res: Response) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res
            .status(400) // 400 Bad Request
            .json({ error: "Please provide a username, password, and email" });
    }

    try {
        const user = await User.create({
            username: username,
            email: email,
            password: bcrypt.hashSync(password, 8),
            facebookUserId: null,
            accessToken: null,
            profilePicture: null,
        });

        return res
            .status(201) // 201 Created
            .json({ message: "User successfully registered" });
    } catch (e: any) {
        console.log(e);
        return res.status(500).json({ error: e }); // 500 Internal Server Error
    }
}

export async function logout() {
    // TODO
}
