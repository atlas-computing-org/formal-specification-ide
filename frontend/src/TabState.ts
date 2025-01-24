export type LeftTabMode = "pdf" | "full-text" | "selected-text"

export type RightTabMode = "pre-written" | "generated"

export interface TabState {
  left: LeftTabMode;
  right: RightTabMode;
}