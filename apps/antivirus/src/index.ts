import "source-map-support/register.js";

import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { RPCRedisBroker } from "@discordjs/brokers";
import NodeClam from "clamscan";
import type { IClamAVResponse } from "shared";
import { Logger } from "tslog";
import { Redis } from "./db.js";

const logger = new Logger();

logger.debug("Creating RPC Broker");

const broker = new RPCRedisBroker({ redisClient: Redis });

logger.debug("Connecting to ClamAV");

const clamd = await new NodeClam().init({
  debugMode: false,
  preference: "clamdscan",
  clamdscan: {
    host: "clamd",
    port: 3_310,
    timeout: 60_000,
    socket: undefined,
    active: true,
  },
});

logger.info("Ready to Scan");

broker.on("scan", async ({ data, ack, reply }) => {
  void ack();

  logger.debug("Recieved Scan Request");

  if (!Buffer.isBuffer(data.data)) {
    const response: IClamAVResponse = {
	  id: data.id,
      success: false,
      error: "Invalid Type Recieved For Data",
    };

    logger.error("Recieved Non Buffer");

    return void reply(response);
  }

  const file = new Readable();
  file.push(data.data);
  file.push(null);

  try {
    const result = await clamd.scanStream(file);

    logger.debug("Sucessfully Scanned Files");

    const response: IClamAVResponse = {
      success: true,
	  id: data.id,
      data: {
        name: result.file,
        infected: result.isInfected,
        viruses: result.viruses,
      },
    };

    return void reply(response);
  } catch (error) {
    if (!(error instanceof Error)) return;

    logger.error(error);

    const response: IClamAVResponse = {
	  id: data.id,
      success: false,
      error: error.message,
    };

    return void reply(response);
  }
});

await broker.subscribe("responders", ["scan"]);
