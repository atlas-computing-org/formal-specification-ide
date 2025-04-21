import { Annotations } from "@common/annotations.ts";
import { Logger } from '../Logger.ts';
import { annotateGraph } from "../agents/graphs/annotateGraph.ts";

export const annotate = async (userUUID: string, lhsText: string, rhsText: string, currentAnnotations: Annotations,
    useDemoCache: boolean, logger: Logger) => {

  const config = { configurable: { thread_id: userUUID } };
  const output = await annotateGraph.invoke({ lhsText: lhsText, rhsText: rhsText, currentAnnotations: currentAnnotations, useDemoCache: useDemoCache, logger: logger }, config);
  return output.decodedAnnotations;
};