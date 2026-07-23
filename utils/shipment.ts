// this file code is use for  unique id generation for  main excel sheet for CRUD operation with the help of unique id genration 

import fs from "fs/promises";
import path from "path";

const COUNTER_FILE = path.join(
  process.cwd(),
  "storage",
  "metadata",
  "shipment-counter.json"
);

interface ShipmentCounter {
  lastShipmentNumber: number;
}

export async function generateShipmentId(): Promise<string> {
  const file = await fs.readFile(COUNTER_FILE, "utf-8");

  const counter: ShipmentCounter = JSON.parse(file);

  counter.lastShipmentNumber++;

  await fs.writeFile(
    COUNTER_FILE,
    JSON.stringify(counter, null, 2)
  );

  return `SHP${counter.lastShipmentNumber
    .toString()
    .padStart(6, "0")}`;
}