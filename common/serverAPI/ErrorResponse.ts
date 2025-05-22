import { DebugInfo } from "@common/DebugInfo.ts";

export interface ErrorResponse {
  error: string;
  debugInfo?: DebugInfo;
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return !!response && "error" in response;
}