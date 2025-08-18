# Specs associated to `src/scalar.rs`

## To do

- Add the specs related to constant time evaluation of relevant functions

## Constants

- ℓ = 2^{252} + 27742317777372353535851937790883648493 (prime order of the Ristretto group and the Ed25519 basepoint)
- h = 8 (cofactor of curve25519)

## Utility functions

- `to_nat_32_u8`: converts from `[u8; 32]` to `nat`, interpreting the 32 byte value in little endian format
- `to_nat_64_u8`: converts from `[u8; 64]` to `nat`, interpreting the 64 byte value in little endian format
- `to_nat_Scalar`: converts from `Scalar` to `nat`, interpreting the 32 byte value stored in `bytes` in little endian format (uses `to_nat_32_u8`)
- `to_nat_DoubleEndedIterator_Bool`: converts from `DoubleEndedIterator` of bits to `nat`, interpreting the bits in little endian format
- `to_nat_UnpackedScalar`: converts from `UnpackedScalar` to `nat` (implementation of `UnpackedScalar` depends on choice of backend)

## Function specifications

### `pub fn from_bytes_mod_order(bytes: [u8; 32]) -> Scalar`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar (from_bytes_mod_order bytes) = (to_nat_32_u8 bytes) mod ℓ

### `pub fn from_bytes_mod_order_wide(input: &[u8; 64]) -> Scalar`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar (from_bytes_mod_order_wide input) = (to_nat_64_u8 input) mod ℓ

### `pub fn from_canonical_bytes(bytes: [u8; 32]) -> CtOption<Scalar>`
`curve25519_dalek::scalar::Scalar`

1. Outputs none if (to_nat_32_u8 bytes) ≥ ℓ
2. Otherwise to_nat_Scalar (from_canonical_bytes bytes) = to_nat_32_u8 bytes

### `pub const ZERO`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar ZERO = 0

### `pub const ONE`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar ONE = 1

### `pub fn random<R>(rng: &mut R) -> Self`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar (random (...)) ∈ {0, 1,..., ℓ - 1}
2. (to_nat_Scalar result) is uniformly random in {0, 1,..., ℓ - 1}

### `pub fn hash_from_bytes<D>(input: &[u8]) -> Scalar`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar (hash_from_bytes (...)) ∈ {0, 1,..., ℓ - 1}
2. Function is deterministic, same input always gives the same result
3. to_nat_Scalar (hash_from_bytes (...)) is uniformly distributed in {0, 1,..., ℓ - 1}

### `pub fn from_hash<D>(hash: D) -> Scalar`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar (from_hash (...)) ∈ {0, 1,..., ℓ - 1}
2. Function is deterministic, same input always gives the same result
3. to_nat_Scalar (from_hash (...)) is uniformly distributed in {0, 1,..., ℓ - 1}

### `pub const fn to_bytes(&self) -> [u8; 32]`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar self = to_nat_32_u8 (to_bytes self)

### `pub const fn as_bytes(&self) -> [u8; 32]`
`curve25519_dalek::scalar::Scalar`

1. to_nat_Scalar self = to_nat_32_u8 (as_bytes self) 

Note: same as above but pointer version

### `pub fn invert(&self) -> Scalar`
`curve25519_dalek::scalar::Scalar`

1. If to_nat_Scalar self ≠ 0 then (to_nat_Scalar self) * (to_nat_Scalar (invert self)) = 1 (mod ℓ)

### `pub fn batch_invert(inputs: &mut [Scalar]) -> Scalar`
`curve25519_dalek::scalar::Scalar`

1. Same as above but for a batch of `Scalar`s

### `pub(crate) fn bits_le(&self) -> impl DoubleEndedIterator<Item = bool> + '_`
`curve25519_dalek::scalar::Scalar`

1. to_nat_DoubleEndedIterator_Bool (bits_le self) = to_nat_Scalar self

### `pub(crate) fn non_adjacent_form(&self, w: usize) -> [i8; 256]`
`curve25519_dalek::scalar::Scalar`
Permitted in source only for (2 ≤ w ≤ 8)
Called "w-Non-Adjacent Form"

let (a_0, a_1,..., a_{255}) = non_adjacent_form self

1. to_nat_Scalar self = ∑_i a_i 2^i,
2. each nonzero coefficient a_i is odd
3. each nonzero coefficient is bounded |a_i| < 2^{w-1}
4. a_{255} is nonzero
5. at most one of any w consecutive coefficients is nonzero

### `pub(crate) fn as_radix_16(&self) -> [i8; 64]`
`curve25519_dalek::scalar::Scalar`

let (a_0, a_1,..., a_{63}) = as_radix_16 self

Requires that to_nat_Scalar self < 2^{255}
1. a = a_0 + a_1 16^1 + \cdots + a_{63} 16^{63}
2. -8 ≤ a_i < 8

### `pub(crate) fn to_radix_2w_size_hint(w: usize) -> usize`
`curve25519_dalek::scalar::Scalar`

To do: Unclear how to specify, returns a size hint indicating how many entries
of the return value of `to_radix_2w` are nonzero.

### `pub(crate) fn as_radix_2w(&self, w: usize) -> [i8; 64]`
`curve25519_dalek::scalar::Scalar`
Permitted in source only for w = 4, 5, 6, 7, 8

let (a_0, a_1,..., a_{63}) = as_radix_2w (self, w)

1. to_nat_Scalar self = a_0 + a_1 2^1 w + \cdots + a_{n-1} 2^{w*(n-1)}
2. -2^w/2 ≤ a_i < 2^w/2 if 0 ≤ i < (n-1)
3. -2^w/2 ≤ a_{n-1} ≤ 2^w/2

### `pub(crate) fn unpack(&self) -> UnpackedScalar`
`curve25519_dalek::scalar::Scalar`

1. to_nat_UnpackedScalar (unpack self) = to_nat_Scalar self

### `fn pack(&self) -> Scalar`
`curve25519_dalek::scalar::UnpackedScalar`

1. to_nat_Scalar (pack self) = to_nat_UnpackedScalar self

### `pub fn montgomery_invert(&self) -> UnpackedScalar`
`curve25519_dalek::scalar::UnpackedScalar`

1. If self is in Montgomery form then (to_nat_UnpackedScalar self) * (to_nat_UnpackedScalar (montgomery_invert self)) = 1 (mod ℓ) 

[Further info](https://briansmith.org/ecc-inversion-addition-chains-01#curve25519_scalar_inversion)

### `pub fn invert(&self) -> UnpackedScalar`
`curve25519_dalek::scalar::UnpackedScalar`

1. (to_nat_UnpackedScalar self) * (to_nat_UnpackedScalar (invert self)) = 1 (mod ℓ) 

Note: likely that self ≠ 0 is required although not stated in the docs

### `pub const fn clamp_integer(mut bytes: [u8; 32]) -> [u8; 32]`
`curve25519_dalek::scalar`

let result = clamp_integer bytes

1. 2^254 ≤ as_nat_32_u8 result
2. as_nat_32_u8 result < 2^255
3. (as_nat_32_u8 result) is divisible by 8 (the cofactor of curve25519)
4. If the input is uniformly random then the result is uniformly random

[Further info](https://neilmadden.blog/2020/05/28/whats-the-curve25519-clamping-all-about/)

