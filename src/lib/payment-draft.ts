type Proof = { uri: string; name: string };

let draft: Proof | null = null;

export const setProofDraft = (p: Proof | null) => {
  draft = p;
};
export const getProofDraft = () => draft;
