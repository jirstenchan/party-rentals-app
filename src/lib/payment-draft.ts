type Proof = { uri: string; name: string };

// Keeps the selected payment proof in memory so checkout screens can share it
// before submission. This draft is not persisted and is cleared by setting it to null.
let draft: Proof | null = null;

/** Set or clear the current payment proof draft. */
export const setProofDraft = (p: Proof | null) => {
  draft = p;
};

/** Return the current payment proof draft, or null if none has been selected. */
export const getProofDraft = () => draft;
