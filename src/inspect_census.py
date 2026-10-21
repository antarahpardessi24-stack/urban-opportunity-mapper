from pathlib import Path
import pandas as pd


# ============================================================
# PATH
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

CENSUS_FILE = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "census"
    / "DDW_PCA2725_2011_MDDS with UI.xlsx"
)


# ============================================================
# LOAD CENSUS
# ============================================================

print("\nLoading Census data...")

df = pd.read_excel(
    CENSUS_FILE,
    sheet_name="EB-2725"
)

print("Total rows:", len(df))


# ============================================================
# FILTER WARD LEVEL
# ============================================================

ward_df = df[
    df["Level"].astype(str).str.strip().str.upper() == "WARD"
].copy()

print("\n" + "=" * 60)
print("WARD-LEVEL DATA")
print("=" * 60)

print("Ward-level rows:", len(ward_df))


# ============================================================
# WARD DISTRIBUTION
# ============================================================

print("\nWard number distribution:")

print(
    ward_df["Ward"]
    .value_counts()
    .sort_index()
)


# ============================================================
# TOWN / VILLAGE DISTRIBUTION FOR WARDS
# ============================================================

print("\n" + "=" * 60)
print("TOWN/VILLAGE VALUES FOR WARD ROWS")
print("=" * 60)

print(
    ward_df["Town/Village"]
    .value_counts(dropna=False)
    .sort_index()
)


# ============================================================
# SHOW ALL WARD ROW IDENTIFIERS
# ============================================================

print("\n" + "=" * 60)
print("WARD IDENTIFICATION DATA")
print("=" * 60)

identifier_columns = [
    "State",
    "District",
    "Subdistt",
    "Town/Village",
    "Ward",
    "EB",
    "Level",
    "Name",
    "TRU"
]

print(
    ward_df[identifier_columns]
    .to_string(index=False)
)


# ============================================================
# UNIQUE WARD + TOWN/VILLAGE COMBINATIONS
# ============================================================

print("\n" + "=" * 60)
print("UNIQUE WARD + TOWN/VILLAGE")
print("=" * 60)

unique_combinations = (
    ward_df[
        [
            "Town/Village",
            "Ward",
            "Name"
        ]
    ]
    .drop_duplicates()
    .sort_values(
        ["Town/Village", "Ward"]
    )
)

print(
    unique_combinations.to_string(index=False)
)


# ============================================================
# CENSUS WARD NUMBERS
# ============================================================

print("\n" + "=" * 60)
print("CENSUS WARD NUMBERS")
print("=" * 60)

print(
    sorted(
        ward_df["Ward"]
        .dropna()
        .unique()
        .tolist()
    )
)


print("\n" + "=" * 60)
print("WARD INSPECTION COMPLETE")
print("=" * 60)