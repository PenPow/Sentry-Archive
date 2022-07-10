import { execSync } from "node:child_process";
import { sanitizeUrl } from "@braintree/sanitize-url";
import parser from "body-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { AV_API_TOKEN } from "../common/config.js";
import { log, LogLevel } from "../common/logger.js";

const app = express();

const loggerMiddleware = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
	log({ level: LogLevel.Debug, prefix: 'Incoming' }, `${req.method} ${req.url}`);
	next();
};

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	if (req.get('x-api-token') !== AV_API_TOKEN) return res.json({ message: 'Invalid API Key' }).status(403);

	return next();
};

app.use(helmet());
app.use(parser.json());
app.use(cors());

app.use(loggerMiddleware);
app.use(authMiddleware);

app.post('/scan', (req: express.Request, res: express.Response) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	if (!req.body || !req.body.url) return res.json({ message: 'Invalid Body' }).status(400);

	try {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const stdout = execSync(`curl ${req.body.url.split('?')[1] ? `-G -d '${req.body.url.split('?')[1]}'` : ''}${sanitizeUrl(req.body.url.split('?')[0] as string)} | clamscan -`, { stdio: 'pipe' });

		const infected = stdout.toString('utf-8').split('\n').find(val => val.startsWith('Infected Files: ')) ?? 'Infected Files: 0';

		return res.status(200).json({ message: parseInt(infected.substring(16, 17), 10) > 0 ? 'NOT OK' : 'OK' });
	} catch {
		return res.status(500);
	}
});

app.listen(8080, () => log({ level: LogLevel.Success, prefix: 'Express' }, 'Running on Port 8080'));
