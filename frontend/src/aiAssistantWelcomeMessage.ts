// TODO: Move this into a .txt file
export const AI_ASSISTANT_WELCOME_MESSAGE =
`How can I help today?

Here are some topics you can ask me about:

- High-Level Comparison
- Precision and Completeness
- Consistency and Ambiguity
- Traceability
- Verification and Proofs

For example, you can ask me:

- Does the Lean specification define all relevant invariants and preconditions as described in the requirements?
- Are there any ambiguities in the natural language requirements that need clarification in the Lean specification?
- Do you notice any contradictions between the natural language requirements and the Lean specification?
- What vulnerabilities in the mechanization could an adversary take advantage of?`

/* Alternative:
export const AI_ASSISTANT_WELCOME_MESSAGE =
`How can I help today? Here are example questions you can ask me:

High-Level Comparison:
- Have you identified all the key functional requirements in the natural language document?
- Does the Lean specification address each of the identified requirements from the natural language document?
- Do the formal definitions in Lean correspond to the terminology and concepts in the natural language document?

Precision and Completeness:
- Are the edge cases mentioned in the natural language requirements explicitly handled in the Lean specification?
- Does the Lean specification define all relevant invariants and preconditions as described in the requirements?

Consistency and Ambiguity:
- Are there any ambiguities in the natural language requirements that need clarification in the Lean specification?
- Do you notice any contradictions between the natural language requirements and the Lean specification?
- Do any of the traces point out deficiencies or mistakes in the mechanization?
- What vulnerabilities in the mechanization could an adversary take advantage of?

Traceability:
- Can you trace each requirement in the natural language document to a specific formal lemma or definition in the Lean specification?
- Are all dependencies between requirements (such as one requirement depending on the fulfillment of another) properly captured in the Lean specification?

Verification and Proofs:
- Does the Lean specification include proofs or reasoning for all critical correctness properties?
- Are there any assumptions made in the Lean specification that should be explicitly stated or justified based on the natural language requirements?`
*/