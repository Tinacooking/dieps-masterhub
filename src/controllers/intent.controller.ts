import { Request, Response } from "express";
import { parseIntent } from "../services/nlp";

export const parseIntentController = async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    try {
        const result = await parseIntent(prompt);
        if (result.error) return res.status(400).json(result);
        return res.json(result);
    } catch(e) {
        console.error("NLP Error:", e);
        return res.status(500).json({ error: "Internal error parsing intent" });
    }
};
