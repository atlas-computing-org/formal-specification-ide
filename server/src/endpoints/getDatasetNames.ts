import { Request } from 'express';
import { promises as fs } from 'fs';
import { Logger } from '../Logger.ts';
import { SERVER_DATA_DIR } from '../util/fileUtils.ts';
import { GetDatasetNamesResponse } from "@common/serverAPI/getDatasetNamesAPI.ts";

export const getDatasetNamesHandler = async (_req: Request, _requestLogger: Logger): Promise<GetDatasetNamesResponse> => {
  const entries = await fs.readdir(SERVER_DATA_DIR, { withFileTypes: true });
  const datasetNames = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  return { data: { datasetNames } };
}