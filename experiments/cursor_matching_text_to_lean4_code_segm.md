# Matching Text to Lean4 Code Segments
_Exported on 5/16/2025 at 12:35:12 PDT from Cursor (0.50.4)_

---

**User**

Pick five key paragraphs in "selected-text.txt" and match each of them to the most relevant segments of the Lean4 code in pre-written.txt.

---

**Cursor**

I'll analyze the selected text and match key paragraphs with their corresponding Lean4 code implementations. Let me pick five significant paragraphs and match them:

1. **SubBytes() Description (Section 5.1.1)**
```
SUBBYTES() is an invertible, non-linear transformation of the state in which a substitution table, called an S-box, is applied independently to each byte in the state. The AES S-box is denoted by SBox().
```
This matches with the Lean4 implementation:
```lean
def subBytes (state : Array UInt8) : Array UInt8 :=
  state.map (fun byte => sBox.get! byte.toNat)
```
The implementation directly maps each byte in the state through the S-box table, which is defined earlier in the code as `sBox : Array UInt8`.

2. **ShiftRows() Description (Section 5.1.2)**
```
SHIFTROWS() is a transformation of the state in which the bytes in the last three rows of the state are cyclically shifted. The number of positions by which the bytes are shifted depends on the row index r.
```
This matches with the Lean4 implementation:
```lean
def shiftRows (state : Array UInt8) : Array UInt8 :=
  if _: state.size = 16 then
    #[state[0],  state[5],  state[10], state[15],
      state[4],  state[9],  state[14], state[3],
      state[8],  state[13], state[2],  state[7],
      state[12], state[1],  state[6],  state[11]]
```
The implementation performs the cyclic shifts by rearranging the array indices according to the specification.

3. **MixColumns() Description (Section 5.1.3)**
```
MixColumns() is a transformation of the state that multiplies each of the four columns of the state by a single fixed matrix, as described in Section 4.3, with its entries taken from the following word: [a0, a1, a2, a3] = [{02}, {01}, {01}, {03}].
```
This matches with the Lean4 implementation:
```lean
def mixColumn (col : Array UInt8) : Array UInt8 :=
  if _: col.size = 4 then
    #[gfMul 0x02 col[0] ^^^ gfMul 0x03 col[1] ^^^ gfMul 0x01 col[2] ^^^ gfMul 0x01 col[3],
      gfMul 0x01 col[0] ^^^ gfMul 0x02 col[1] ^^^ gfMul 0x03 col[2] ^^^ gfMul 0x01 col[3],
      gfMul 0x01 col[0] ^^^ gfMul 0x01 col[1] ^^^ gfMul 0x02 col[2] ^^^ gfMul 0x03 col[3],
      gfMul 0x03 col[0] ^^^ gfMul 0x01 col[1] ^^^ gfMul 0x01 col[2] ^^^ gfMul 0x02 col[3]]
```
The implementation uses the `gfMul` function to perform the finite field multiplication with the specified coefficients.

4. **CIPHER() Algorithm Description (Section 5.1)**
```
The rounds in the specification of CIPHER() are composed of the following four byte-oriented transformations on the state:
* SubBytes() applies a substitution table (S-box) to each byte.
* ShiftRows() shifts rows of the state array by different offsets.
* MixColumns() mixes the data within each column of the state array.
* ADDROUNDKEY() combines a round key with the state.
```
This matches with the Lean4 implementation:
```lean
def cipher (input : Array UInt8) (keySchedule : Array UInt8) (Nr : Nat) : Array UInt8 := Id.run do
  let mut state := input
  state := addRoundKey state (keySchedule.extract 0 16)
  for round in [1:Nr] do
    state := subBytes state
    state := shiftRows state
    state := mixColumns state
    state := addRoundKey state (keySchedule.extract (round * 16) ((round + 1) * 16))
  state := subBytes state
  state := shiftRows state
  state := addRoundKey state (keySchedule.extract (Nr * 16) ((Nr + 1) * 16))
  state
```
The implementation follows the exact sequence of transformations specified in the algorithm.

5. **Key Expansion Description (Section 5.2)**
```
An expansion routine, denoted by KEYEXPANSION(), takes the block cipher key as input and generates the round keys as output. In particular, the input to KEYEXPANSION() is represented as an array of words, denoted by key, and the output is an expanded array of words, denoted by w, called the key schedule.
```
This matches with the Lean4 implementation:
```lean
def keyExpansion (key : Array UInt8) (Nk Nr : Nat) : Array UInt8 := Id.run do
  let Nb := 4 -- Block size in words
  let totalWords := Nb * (Nr + 1)
  let mut w := Array.mkEmpty (totalWords * 4)

  -- Copy the original key into the first Nk words
  for i in [0:Nk] do
    w := w ++ key.extract (4 * i) (4 * (i + 1))

  -- Expand the key schedule
  for i in [Nk:totalWords] do
    let mut temp : Array UInt8 := w.extract (4 * (i - 1)) (4 * i)
    if i % Nk == 0 then
      temp := subWord (rotWord temp)
      temp := temp.set! 0 (temp[0]! ^^^ rcon[(i / Nk) - 1]!)
    else if Nk > 6 && i % Nk == 4 then
      temp := subWord temp
    let prevWord := w.extract (4 * (i - Nk)) (4 * (i - Nk + 1))
    temp := temp.zipWith prevWord (· ^^^ ·)
    w := w ++ temp
  w
```
The implementation follows the key expansion algorithm, including the special cases for different key sizes and the use of the Rcon values.

These matches demonstrate how the Lean4 implementation faithfully follows the mathematical specification from the FIPS 197 standard, with each component carefully implemented to match the described behavior.

```plaintext
SUBBYTES() is an invertible, non-linear transformation of the state in which a substitution table, called an S-box, is applied independently to each byte in the state. The AES S-box is denoted by SBox().
```

```plaintext
def subBytes (state : Array UInt8) : Array UInt8 :=
  state.map (fun byte => sBox.get! byte.toNat)
```

```plaintext
SHIFTROWS() is a transformation of the state in which the bytes in the last three rows of the state are cyclically shifted. The number of positions by which the bytes are shifted depends on the row index r.
```

```plaintext
def shiftRows (state : Array UInt8) : Array UInt8 :=
  if _: state.size = 16 then
    #[state[0],  state[5],  state[10], state[15],
      state[4],  state[9],  state[14], state[3],
      state[8],  state[13], state[2],  state[7],
      state[12], state[1],  state[6],  state[11]]
```

```plaintext
MixColumns() is a transformation of the state that multiplies each of the four columns of the state by a single fixed matrix, as described in Section 4.3, with its entries taken from the following word: [a0, a1, a2, a3] = [{02}, {01}, {01}, {03}].
```

```plaintext
def mixColumn (col : Array UInt8) : Array UInt8 :=
  if _: col.size = 4 then
    #[gfMul 0x02 col[0] ^^^ gfMul 0x03 col[1] ^^^ gfMul 0x01 col[2] ^^^ gfMul 0x01 col[3],
      gfMul 0x01 col[0] ^^^ gfMul 0x02 col[1] ^^^ gfMul 0x03 col[2] ^^^ gfMul 0x01 col[3],
      gfMul 0x01 col[0] ^^^ gfMul 0x01 col[1] ^^^ gfMul 0x02 col[2] ^^^ gfMul 0x03 col[3],
      gfMul 0x03 col[0] ^^^ gfMul 0x01 col[1] ^^^ gfMul 0x01 col[2] ^^^ gfMul 0x02 col[3]]
```

```plaintext
The rounds in the specification of CIPHER() are composed of the following four byte-oriented transformations on the state:
* SubBytes() applies a substitution table (S-box) to each byte.
* ShiftRows() shifts rows of the state array by different offsets.
* MixColumns() mixes the data within each column of the state array.
* ADDROUNDKEY() combines a round key with the state.
```

```plaintext
def cipher (input : Array UInt8) (keySchedule : Array UInt8) (Nr : Nat) : Array UInt8 := Id.run do
  let mut state := input
  state := addRoundKey state (keySchedule.extract 0 16)
  for round in [1:Nr] do
    state := subBytes state
    state := shiftRows state
    state := mixColumns state
    state := addRoundKey state (keySchedule.extract (round * 16) ((round + 1) * 16))
  state := subBytes state
  state := shiftRows state
  state := addRoundKey state (keySchedule.extract (Nr * 16) ((Nr + 1) * 16))
  state
```

```plaintext
An expansion routine, denoted by KEYEXPANSION(), takes the block cipher key as input and generates the round keys as output. In particular, the input to KEYEXPANSION() is represented as an array of words, denoted by key, and the output is an expanded array of words, denoted by w, called the key schedule.
```

```plaintext
def keyExpansion (key : Array UInt8) (Nk Nr : Nat) : Array UInt8 := Id.run do
  let Nb := 4 -- Block size in words
  let totalWords := Nb * (Nr + 1)
  let mut w := Array.mkEmpty (totalWords * 4)

  -- Copy the original key into the first Nk words
  for i in [0:Nk] do
    w := w ++ key.extract (4 * i) (4 * (i + 1))

  -- Expand the key schedule
  for i in [Nk:totalWords] do
    let mut temp : Array UInt8 := w.extract (4 * (i - 1)) (4 * i)
    if i % Nk == 0 then
      temp := subWord (rotWord temp)
      temp := temp.set! 0 (temp[0]! ^^^ rcon[(i / Nk) - 1]!)
    else if Nk > 6 && i % Nk == 4 then
      temp := subWord temp
    let prevWord := w.extract (4 * (i - Nk)) (4 * (i - Nk + 1))
    temp := temp.zipWith prevWord (· ^^^ ·)
    w := w ++ temp
  w
```

---

**User**

For each of the text to code mappings above, do you see any inconsistencies in the code in meeting the requirements spelt out in the text?

---

**Cursor**

Let me analyze each mapping for potential inconsistencies:

1. **SubBytes() Implementation**
The text specifies that SubBytes() applies an S-box transformation that involves two steps:
1. Finding the multiplicative inverse
2. Applying an affine transformation

However, the Lean4 implementation:
```lean
def subBytes (state : Array UInt8) : Array UInt8 :=
  state.map (fun byte => sBox.get! byte.toNat)
```
simply looks up values in a pre-computed S-box table. While this is a valid optimization, it doesn't directly implement the mathematical process described in the text. The implementation assumes the S-box table (`sBox`) has been pre-computed correctly, but doesn't show how these values were derived from the mathematical specification.

2. **ShiftRows() Implementation**
The text specifies that bytes in the last three rows are cyclically shifted by different offsets depending on the row index r. The implementation:
```lean
def shiftRows (state : Array UInt8) : Array UInt8 :=
  if _: state.size = 16 then
    #[state[0],  state[5],  state[10], state[15],
      state[4],  state[9],  state[14], state[3],
      state[8],  state[13], state[2],  state[7],
      state[12], state[1],  state[6],  state[11]]
```
While this implementation is correct, it's not immediately clear from the code that it's implementing the row-wise shifts described in the text. The array indices are hardcoded rather than being computed based on the row index r. A more explicit implementation might make the relationship to the mathematical specification clearer.

3. **MixColumns() Implementation**
The text specifies a matrix multiplication with specific coefficients. The implementation:
```lean
def mixColumn (col : Array UInt8) : Array UInt8 :=
  if _: col.size = 4 then
    #[gfMul 0x02 col[0] ^^^ gfMul 0x03 col[1] ^^^ gfMul 0x01 col[2] ^^^ gfMul 0x01 col[3],
      gfMul 0x01 col[0] ^^^ gfMul 0x02 col[1] ^^^ gfMul 0x03 col[2] ^^^ gfMul 0x01 col[3],
      gfMul 0x01 col[0] ^^^ gfMul 0x01 col[1] ^^^ gfMul 0x02 col[2] ^^^ gfMul 0x03 col[3],
      gfMul 0x03 col[0] ^^^ gfMul 0x01 col[1] ^^^ gfMul 0x01 col[2] ^^^ gfMul 0x02 col[3]]
```
The implementation is correct but doesn't explicitly show the matrix structure described in the text. The coefficients are hardcoded rather than being derived from the matrix representation. This makes it less obvious that it's implementing the matrix multiplication specified in the text.

4. **CIPHER() Implementation**
The text specifies a sequence of transformations, and the implementation:
```lean
def cipher (input : Array UInt8) (keySchedule : Array UInt8) (Nr : Nat) : Array UInt8 := Id.run do
  let mut state := input
  state := addRoundKey state (keySchedule.extract 0 16)
  for round in [1:Nr] do
    state := subBytes state
    state := shiftRows state
    state := mixColumns state
    state := addRoundKey state (keySchedule.extract (round * 16) ((round + 1) * 16))
  state := subBytes state
  state := shiftRows state
  state := addRoundKey state (keySchedule.extract (Nr * 16) ((Nr + 1) * 16))
  state
```
The implementation is consistent with the text, but it doesn't include any validation of the input parameters (like checking if the input and key schedule have the correct sizes). The text doesn't explicitly require these checks, but they would make the implementation more robust.

5. **Key Expansion Implementation**
The text describes the key expansion process, and the implementation:
```lean
def keyExpansion (key : Array UInt8) (Nk Nr : Nat) : Array UInt8 := Id.run do
  let Nb := 4 -- Block size in words
  let totalWords := Nb * (Nr + 1)
  let mut w := Array.mkEmpty (totalWords * 4)

  -- Copy the original key into the first Nk words
  for i in [0:Nk] do
    w := w ++ key.extract (4 * i) (4 * (i + 1))

  -- Expand the key schedule
  for i in [Nk:totalWords] do
    let mut temp : Array UInt8 := w.extract (4 * (i - 1)) (4 * i)
    if i % Nk == 0 then
      temp := subWord (rotWord temp)
      temp := temp.set! 0 (temp[0]! ^^^ rcon[(i / Nk) - 1]!)
    else if Nk > 6 && i % Nk == 4 then
      temp := subWord temp
    let prevWord := w.extract (4 * (i - Nk)) (4 * (i - Nk + 1))
    temp := temp.zipWith prevWord (· ^^^ ·)
    w := w ++ temp
  w
```
The implementation is mostly consistent with the text, but there are a few potential issues:
1. It doesn't validate that the input key has the correct size for the given Nk
2. The Rcon array is hardcoded rather than being computed as specified in the text
3. The implementation uses array operations that might not be as clear as the word-based operations described in the text

These inconsistencies don't necessarily mean the implementation is incorrect - many of them are valid optimizations or implementation choices. However, they do make it less obvious that the code directly implements the mathematical specification from the text. A more explicit implementation might make the relationship between the specification and the code clearer, though it might be less efficient.

```plaintext
def subBytes (state : Array UInt8) : Array UInt8 :=
  state.map (fun byte => sBox.get! byte.toNat)
```

```plaintext
def shiftRows (state : Array UInt8) : Array UInt8 :=
  if _: state.size = 16 then
    #[state[0],  state[5],  state[10], state[15],
      state[4],  state[9],  state[14], state[3],
      state[8],  state[13], state[2],  state[7],
      state[12], state[1],  state[6],  state[11]]
```

```plaintext
def mixColumn (col : Array UInt8) : Array UInt8 :=
  if _: col.size = 4 then
    #[gfMul 0x02 col[0] ^^^ gfMul 0x03 col[1] ^^^ gfMul 0x01 col[2] ^^^ gfMul 0x01 col[3],
      gfMul 0x01 col[0] ^^^ gfMul 0x02 col[1] ^^^ gfMul 0x03 col[2] ^^^ gfMul 0x01 col[3],
      gfMul 0x01 col[0] ^^^ gfMul 0x01 col[1] ^^^ gfMul 0x02 col[2] ^^^ gfMul 0x03 col[3],
      gfMul 0x03 col[0] ^^^ gfMul 0x01 col[1] ^^^ gfMul 0x01 col[2] ^^^ gfMul 0x02 col[3]]
```

```plaintext
def cipher (input : Array UInt8) (keySchedule : Array UInt8) (Nr : Nat) : Array UInt8 := Id.run do
  let mut state := input
  state := addRoundKey state (keySchedule.extract 0 16)
  for round in [1:Nr] do
    state := subBytes state
    state := shiftRows state
    state := mixColumns state
    state := addRoundKey state (keySchedule.extract (round * 16) ((round + 1) * 16))
  state := subBytes state
  state := shiftRows state
  state := addRoundKey state (keySchedule.extract (Nr * 16) ((Nr + 1) * 16))
  state
```

```plaintext
def keyExpansion (key : Array UInt8) (Nk Nr : Nat) : Array UInt8 := Id.run do
  let Nb := 4 -- Block size in words
  let totalWords := Nb * (Nr + 1)
  let mut w := Array.mkEmpty (totalWords * 4)

  -- Copy the original key into the first Nk words
  for i in [0:Nk] do
    w := w ++ key.extract (4 * i) (4 * (i + 1))

  -- Expand the key schedule
  for i in [Nk:totalWords] do
    let mut temp : Array UInt8 := w.extract (4 * (i - 1)) (4 * i)
    if i % Nk == 0 then
      temp := subWord (rotWord temp)
      temp := temp.set! 0 (temp[0]! ^^^ rcon[(i / Nk) - 1]!)
    else if Nk > 6 && i % Nk == 4 then
      temp := subWord temp
    let prevWord := w.extract (4 * (i - Nk)) (4 * (i - Nk + 1))
    temp := temp.zipWith prevWord (· ^^^ ·)
    w := w ++ temp
  w
```

---

**User**

For each text to code mapping above, write a new version of the Lean4 code that addresses the issues you highlighted above.

---

**Cursor**

I'll write improved versions of each implementation that more directly reflects the mathematical specification:

1. **SubBytes() Implementation**
```lean
def subBytes (state : Array UInt8) : Array UInt8 := Id.run do
  -- First compute multiplicative inverse
  let mut result := Array.mkEmpty state.size
  for byte in state do
    -- Compute multiplicative inverse in GF(2^8)
    let inv := if byte == 0 then 0 else
      let mut x := byte
      let mut y := 1
      let mut z := 0
      let mut w := 0x11B  -- Irreducible polynomial x^8 + x^4 + x^3 + x + 1
      while x != 0 do
        if (x &&& 1) == 0 then
          x := x >>> 1
          if (y &&& 1) == 1 then
            y := y ^^^ w
          y := y >>> 1
        else if (w &&& 1) == 0 then
          w := w >>> 1
          if (z &&& 1) == 1 then
            z := z ^^^ x
          z := z >>> 1
        else
          w := w ^^^ x
          z := z ^^^ y
    -- Apply affine transformation
    let mut transformed := 0
    for i in [0:8] do
      let bit := ((inv >>> i) &&& 1) ^^^
                 ((inv >>> ((i + 4) % 8)) &&& 1) ^^^
                 ((inv >>> ((i + 5) % 8)) &&& 1) ^^^
                 ((inv >>> ((i + 6) % 8)) &&& 1) ^^^
                 ((inv >>> ((i + 7) % 8)) &&& 1) ^^^
                 ((0x63 >>> i) &&& 1)
      transformed := transformed ||| (bit <<< i)
    result := result.push transformed.toUInt8
  result
```

2. **ShiftRows() Implementation**
```lean
def shiftRows (state : Array UInt8) : Array UInt8 := Id.run do
  if _: state.size = 16 then
    let mut result := Array.mkEmpty 16
    -- For each row r
    for r in [0:4] do
      -- For each column c
      for c in [0:4] do
        -- Apply the shift: s'[r,c] = s[r,(c+r) mod 4]
        let newCol := (c + r) % 4
        let idx := r * 4 + newCol
        result := result.push state[idx]!
    result
  else
    panic! "shiftRows requires an array of exactly 16 elements"
```

3. **MixColumns() Implementation**
```lean
def mixColumns (state : Array UInt8) : Array UInt8 := Id.run do
  if _: state.size = 16 then
    let mut result := Array.mkEmpty 16
    -- Define the fixed matrix coefficients
    let matrix := #[#[0x02, 0x03, 0x01, 0x01],
                   #[0x01, 0x02, 0x03, 0x01],
                   #[0x01, 0x01, 0x02, 0x03],
                   #[0x03, 0x01, 0x01, 0x02]]
    
    -- For each column in the state
    for c in [0:4] do
      let col := #[state[c]!, state[4 + c]!, state[8 + c]!, state[12 + c]!]
      -- Matrix multiplication
      for r in [0:4] do
        let mut sum := 0
        for i in [0:4] do
          sum := sum ^^^ gfMul matrix[r]![i]! col[i]!
        result := result.push sum.toUInt8
    result
  else
    panic! "mixColumns requires an array of exactly 16 elements"
```

4. **CIPHER() Implementation**
```lean
def cipher (input : Array UInt8) (keySchedule : Array UInt8) (Nr : Nat) : Array UInt8 := Id.run do
  -- Validate input sizes
  if input.size != 16 then
    panic! "Input must be exactly 16 bytes"
  if keySchedule.size != 16 * (Nr + 1) then
    panic! "Key schedule must be exactly 16 * (Nr + 1) bytes"
  
  let mut state := input
  -- Initial round key addition
  state := addRoundKey state (keySchedule.extract 0 16)
  
  -- Main rounds
  for round in [1:Nr] do
    -- Apply the four transformations in sequence
    state := subBytes state
    state := shiftRows state
    state := mixColumns state
    state := addRoundKey state (keySchedule.extract (round * 16) ((round + 1) * 16))
  
  -- Final round (without MixColumns)
  state := subBytes state
  state := shiftRows state
  state := addRoundKey state (keySchedule.extract (Nr * 16) ((Nr + 1) * 16))
  state
```

5. **Key Expansion Implementation**
```lean
def keyExpansion (key : Array UInt8) (Nk Nr : Nat) : Array UInt8 := Id.run do
  -- Validate input key size
  if key.size != 4 * Nk then
    panic! s!"Key must be exactly {4 * Nk} bytes for Nk = {Nk}"
  
  let Nb := 4  -- Block size in words
  let totalWords := Nb * (Nr + 1)
  let mut w := Array.mkEmpty (totalWords * 4)
  
  -- Copy the original key into the first Nk words
  for i in [0:Nk] do
    w := w ++ key.extract (4 * i) (4 * (i + 1))
  
  -- Compute Rcon values dynamically
  let mut rcon := #[0x01]
  for i in [1:10] do
    rcon := rcon.push (if rcon[i-1]! < 0x80 then rcon[i-1]! * 2 else (rcon[i-1]! * 2) ^^^ 0x11B)
  
  -- Expand the key schedule
  for i in [Nk:totalWords] do
    let mut temp := w.extract (4 * (i - 1)) (4 * i)
    
    if i % Nk == 0 then
      -- RotWord and SubWord operations
      temp := rotWord temp
      temp := subWord temp
      -- XOR with Rcon
      temp := temp.set! 0 (temp[0]! ^^^ rcon[(i / Nk) - 1]!)
    else if Nk > 6 && i % Nk == 4 then
      -- Additional SubWord for AES-256
      temp := subWord temp
    
    -- XOR with previous word
    let prevWord := w.extract (4 * (i - Nk)) (4 * (i - Nk + 1))
    temp := temp.zipWith prevWord (· ^^^ ·)
    w := w ++ temp
  
  w
```

These improved implementations:
1. More directly reflect the mathematical specifications from the text
2. Include proper input validation
3. Make the relationship between the specification and implementation clearer
4. Compute values dynamically where appropriate rather than using hardcoded tables
5. Use more explicit and descriptive variable names
6. Include comments explaining the mathematical operations

However, it's worth noting that these implementations might be less efficient than the original ones, particularly for SubBytes() where the lookup table approach is typically much faster than computing the transformation for each byte. In a real implementation, you might want to keep the optimized versions but add comments or documentation explaining how they relate to the mathematical specification.

```plaintext
def subBytes (state : Array UInt8) : Array UInt8 := Id.run do
  -- First compute multiplicative inverse
  let mut result := Array.mkEmpty state.size
  for byte in state do
    -- Compute multiplicative inverse in GF(2^8)
    let inv := if byte == 0 then 0 else
      let mut x := byte
      let mut y := 1
      let mut z := 0
      let mut w := 0x11B  -- Irreducible polynomial x^8 + x^4 + x^3 + x + 1
      while x != 0 do
        if (x &&& 1) == 0 then
          x := x >>> 1
          if (y &&& 1) == 1 then
            y := y ^^^ w
          y := y >>> 1
        else if (w &&& 1) == 0 then
          w := w >>> 1
          if (z &&& 1) == 1 then
            z := z ^^^ x
          z := z >>> 1
        else
          w := w ^^^ x
          z := z ^^^ y
    -- Apply affine transformation
    let mut transformed := 0
    for i in [0:8] do
      let bit := ((inv >>> i) &&& 1) ^^^
                 ((inv >>> ((i + 4) % 8)) &&& 1) ^^^
                 ((inv >>> ((i + 5) % 8)) &&& 1) ^^^
                 ((inv >>> ((i + 6) % 8)) &&& 1) ^^^
                 ((inv >>> ((i + 7) % 8)) &&& 1) ^^^
                 ((0x63 >>> i) &&& 1)
      transformed := transformed ||| (bit <<< i)
    result := result.push transformed.toUInt8
  result
```

```plaintext
def shiftRows (state : Array UInt8) : Array UInt8 := Id.run do
  if _: state.size = 16 then
    let mut result := Array.mkEmpty 16
    -- For each row r
    for r in [0:4] do
      -- For each column c
      for c in [0:4] do
        -- Apply the shift: s'[r,c] = s[r,(c+r) mod 4]
        let newCol := (c + r) % 4
        let idx := r * 4 + newCol
        result := result.push state[idx]!
    result
  else
    panic! "shiftRows requires an array of exactly 16 elements"
```

```plaintext
def mixColumns (state : Array UInt8) : Array UInt8 := Id.run do
  if _: state.size = 16 then
    let mut result := Array.mkEmpty 16
    -- Define the fixed matrix coefficients
    let matrix := #[#[0x02, 0x03, 0x01, 0x01],
                   #[0x01, 0x02, 0x03, 0x01],
                   #[0x01, 0x01, 0x02, 0x03],
                   #[0x03, 0x01, 0x01, 0x02]]
    
    -- For each column in the state
    for c in [0:4] do
      let col := #[state[c]!, state[4 + c]!, state[8 + c]!, state[12 + c]!]
      -- Matrix multiplication
      for r in [0:4] do
        let mut sum := 0
        for i in [0:4] do
          sum := sum ^^^ gfMul matrix[r]![i]! col[i]!
        result := result.push sum.toUInt8
    result
  else
    panic! "mixColumns requires an array of exactly 16 elements"
```

```plaintext
def cipher (input : Array UInt8) (keySchedule : Array UInt8) (Nr : Nat) : Array UInt8 := Id.run do
  -- Validate input sizes
  if input.size != 16 then
    panic! "Input must be exactly 16 bytes"
  if keySchedule.size != 16 * (Nr + 1) then
    panic! "Key schedule must be exactly 16 * (Nr + 1) bytes"
  
  let mut state := input
  -- Initial round key addition
  state := addRoundKey state (keySchedule.extract 0 16)
  
  -- Main rounds
  for round in [1:Nr] do
    -- Apply the four transformations in sequence
    state := subBytes state
    state := shiftRows state
    state := mixColumns state
    state := addRoundKey state (keySchedule.extract (round * 16) ((round + 1) * 16))
  
  -- Final round (without MixColumns)
  state := subBytes state
  state := shiftRows state
  state := addRoundKey state (keySchedule.extract (Nr * 16) ((Nr + 1) * 16))
  state
```

```plaintext
def keyExpansion (key : Array UInt8) (Nk Nr : Nat) : Array UInt8 := Id.run do
  -- Validate input key size
  if key.size != 4 * Nk then
    panic! s!"Key must be exactly {4 * Nk} bytes for Nk = {Nk}"
  
  let Nb := 4  -- Block size in words
  let totalWords := Nb * (Nr + 1)
  let mut w := Array.mkEmpty (totalWords * 4)
  
  -- Copy the original key into the first Nk words
  for i in [0:Nk] do
    w := w ++ key.extract (4 * i) (4 * (i + 1))
  
  -- Compute Rcon values dynamically
  let mut rcon := #[0x01]
  for i in [1:10] do
    rcon := rcon.push (if rcon[i-1]! < 0x80 then rcon[i-1]! * 2 else (rcon[i-1]! * 2) ^^^ 0x11B)
  
  -- Expand the key schedule
  for i in [Nk:totalWords] do
    let mut temp := w.extract (4 * (i - 1)) (4 * i)
    
    if i % Nk == 0 then
      -- RotWord and SubWord operations
      temp := rotWord temp
      temp := subWord temp
      -- XOR with Rcon
      temp := temp.set! 0 (temp[0]! ^^^ rcon[(i / Nk) - 1]!)
    else if Nk > 6 && i % Nk == 4 then
      -- Additional SubWord for AES-256
      temp := subWord temp
    
    -- XOR with previous word
    let prevWord := w.extract (4 * (i - Nk)) (4 * (i - Nk + 1))
    temp := temp.zipWith prevWord (· ^^^ ·)
    w := w ++ temp
  
  w
```

