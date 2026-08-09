# Data Sources & Synthetic Data Notice

This project uses Pakistan's real administrative hierarchy as the *shape* of its geography
data. It does not use official government statistics.

## Geography (Phase 2)
- Province/territory names and structure: modeled on Pakistan's real administrative
  divisions (4 provinces, ICT, GB, AJK).
- District list: a representative subset of real district names per province/territory —
  not the complete official list.
- Tehsil list: a small illustrative subset, proving the hierarchy model — not exhaustive.
- `demographic_profiles` (population, literacy rate, urban %): entirely synthetic,
  plausible-looking values. Each record is tagged `source`, `as_of_date`, and `confidence`
  and should never be read as official PBS census data.

Every future synthetic dataset added to this project gets an entry here.