import { promises as fs } from 'node:fs';
import { StateInfo } from "../agent.ts";
import { AIMessage } from "@langchain/core/messages";

const cachedResponse = 
`### CHAIN-OF-THOUGHT ANALYSIS

The LHS TEXT and RHS TEXT appear to be describing the same topic - the SHA-1 hash algorithm. The LHS TEXT provides a detailed description of the SHA-1 algorithm, including the preprocessing steps, the hash computation, and the final hash value. The RHS TEXT appears to be an implementation of the SHA-1 algorithm in the Lean programming language.

The key similarities and differences between the two texts are:

1. **Preprocessing**: Both texts describe the preprocessing steps, including padding the message and parsing it into message blocks.
2. **Hash Computation**: The LHS TEXT provides a step-by-step description of the hash computation, including the message schedule, the working variables, and the final hash value computation. The RHS TEXT also implements the main hash function, including the message schedule and the main loop.
3. **Initial Hash Value**: Both texts specify the initial hash value, \`H^(0)\`, for the SHA-1 algorithm.
4. **Differences in Notation**: The LHS TEXT uses mathematical notation and equations, while the RHS TEXT uses Lean programming language constructs and functions.
5. **Implementation Details**: The RHS TEXT provides additional implementation details, such as the \`padMessage\` and \`chunkify\` functions, which are not explicitly described in the LHS TEXT.

### JSON ANNOTATIONS

\`\`\`json
[
  {
    "description": "Preprocessing",
    "lhsText": [
      "Preprocessing consists of three steps: padding the message, \(M\) (Sec. 5.1), parsing the message into message blocks (Sec. 5.2), and setting the initial hash value, \(H^{(0)}\) (Sec. 5.3)."
    ],
    "rhsText": [
      "-- Padding function",
      "def padMessage (msg : ByteArray) : ByteArray :",
      "-- Break message into 512-bit (64-byte) chunks",
      "def chunkify (msg : ByteArray) : Array ByteArray :"
    ],
    "status": "default"
  },
  {
    "description": "Initial Hash Value",
    "lhsText": [
      "For SHA-1, the initial hash value, \(H^{(0)}\), shall consist of the following five 32-bit words, in hex:"
    ],
    "rhsText": [
      "-- Initial hash values (H0) as per FIPS 180-4",
      "def initialHash : Mathlib.Vector Word 5 :="
    ],
    "status": "default"
  },
  {
    "description": "Hash Computation",
    "lhsText": [
      "The SHA-1 hash computation uses functions and constants previously defined in Sec. 4.1.1 and Sec. 4.2.1, respectively. Addition (+) is performed modulo \(2^{32}\).",
      "Each message block, \(M^{(1)}, M^{(2)}, \ldots, M^{(N)}\), is processed in order, using the following steps:"
    ],
    "rhsText": [
      "-- Main hash function",
      "def hash (message : ByteArray) : ByteArray :"
    ],
    "status": "default"
  },
  {
    "description": "Message Schedule",
    "lhsText": [
      "Prepare the message schedule, \(\left\{W_{t}\right\}\) :"
    ],
    "rhsText": [
      "-- Prepare the message schedule W"
    ],
    "status": "default"
  },
  {
    "description": "Working Variables",
    "lhsText": [
      "Initialize the five working variables, \(\boldsymbol{a}, \boldsymbol{b}, \boldsymbol{c}, \boldsymbol{d}\), and \(\boldsymbol{e}\), with the \((i-1)^{\text {st }}\) hash value:"
    ],
    "rhsText": [
      "-- Initialize working variables"
    ],
    "status": "default"
  },
  {
    "description": "Main Loop",
    "lhsText": [
      "For \(t=0\) to 79 :\\\\{",
      "\[\\begin{aligned} & T=R O T L^{5}(a)+f_{t}(b, c, d)+e+K_{t}+W_{t} \\\\ & e=d \\\\ & d=c \\\\ & c=R O T L^{30}(b) \\\\ & b=a \\\\ & a=T\\end{aligned}\]",
      "}"
    ],
    "rhsText": [
      "-- Main loop",
      "for t in [0:80] do"
    ],
    "status": "default"
  },
  {
    "description": "Final Hash Value",
    "lhsText": [
      "Compute the \(i^{\text {th }}\) intermediate hash value \(H^{(i)}\) :",
      "\[\\begin{aligned} & H_{0}^{(i)}=a+H_{0}^{(i-1)} \\\\ & H_{1}^{(i)}=b+H_{1}^{(i-1)} \\\\ & H_{2}^{(i)}=c+H_{2}^{(i-1)} \\\\ & H_{3}^{(i)}=d+H_{3}^{(i-1)} \\\\ & H_{4}^{(i)}=e+H_{4}^{(i-1)}\\end{aligned}\]",
      "After repeating steps one through four a total of \(N\) times (i.e., after processing \(M^{(N)}\) ), the resulting 160-bit message digest of the message, \(M\), is",
      "\[H_{0}^{(N)}\left\|H_{1}^{(N)}\right\| H_{2}^{(N)}\left\|H_{3}^{(N)}\right\| H_{4}^{(N)}\]"
    ],
    "rhsText": [
      "-- Compute the new hash values",
      "let finalHash := chunks.foldl (init := H) fun h0 chunk =>",
      "-- Concatenate the final hash values into a ByteArray"
    ],
    "status": "default"
  },
  {
    "description": "Utility Functions",
    "lhsText": [
      "The SHA-1 hash computation uses functions and constants previously defined in Sec. 4.1.1 and Sec. 4.2.1, respectively."
    ],
    "rhsText": [
      "-- Left rotate operation using mathlib's rotateLeft",
      "def ROTL (n : Nat) (x : Word) : Word :",
      "-- Convert a 4-byte slice to a Word (UInt32)",
      "def bytesToWord (bytes : ByteArray) : Word :"
    ],
    "status": "default"
  }
]
\`\`\`

### NOTES AND CONCERNS

The LHS TEXT and RHS TEXT appear to be well-aligned and complementary. The LHS TEXT provides a detailed mathematical description of the SHA-1 algorithm, while the RHS TEXT provides a concrete implementation in the Lean programming language. The annotations capture the key similarities and differences between the two texts, and there are no major concerns.
`;

export const cacheNode = (state: typeof StateInfo.State) => {
  state.logger.info("Using cached LLM response. This only works for the demo.");
  // Update message history with cached response:
  return { messages: [new AIMessage(cachedResponse)] };
};