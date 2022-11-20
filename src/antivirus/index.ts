import "source-map-support/register.js";

import { logger } from '../common/utils.js';
import { RPCRedisBroker } from '@discordjs/brokers';
import type { IClamAVResponse } from '../common/clamav.js'
import NodeClam from 'clamscan';
import { Readable } from 'stream';
import { Redis } from "./db.js";

logger.debug("Creating RPC Broker")

const broker = new RPCRedisBroker({ redisClient: Redis });

logger.debug("Connecting to ClamAV")

const clamd = await new NodeClam().init({
	debugMode: false,
	preference: 'clamdscan',
	clamdscan: {
	  host: 'clamd',
	  port: 3310,
	  timeout: 60000,
	  socket: undefined,
	  active: true,
	}
})

logger.info("Ready to Scan")

broker.on('scan', async ({ data, ack, reply }) => {
	void ack()

	logger.debug("Recieved Scan Request")

	if(!Buffer.isBuffer(data)) {
		const response: IClamAVResponse = {
			success: false,
			error: "Invalid Type Recieved For Data"
		}

		logger.error("Recieved Non Buffer")
		
		return void reply(response)
	}

	const file = new Readable()
	file.push(data)
	file.push(null)

	try {
		const result = await clamd.scanStream(file);

		logger.debug("Sucessfully Scanned Files")

		const response: IClamAVResponse = {
			success: true,
			data: {
				name: result.file,
				infected: result.isInfected,
				viruses: result.viruses
			}
		}

		return void reply(response)
	} catch (err) {
		if(!(err instanceof Error)) return;

		logger.error(err)

		const response: IClamAVResponse = {
			success: false,
			error: err.message
		}

		return void reply(response)
	}
	
});

await broker.subscribe('responders', ['scan'])