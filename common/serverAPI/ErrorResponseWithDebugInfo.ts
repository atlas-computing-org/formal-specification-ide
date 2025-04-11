import { DebugInfo } from "@common/DebugInfo.ts";

export interface ErrorResponseWithDebugInfo {
  error: string;
  debugInfo?: DebugInfo;
}