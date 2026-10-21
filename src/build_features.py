from pathlib import Path

import geopandas as gpd
import pandas as pd


# ============================================================
# 1. PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

PROCESSED_DATA = PROJECT_ROOT / "data" / "processed"

WARDS_FILE = PROCESSED_DATA / "ward_population.geojson"
POIS_FILE = PROCESSED_DATA / "pois_clean.geojson"
PMPML_FILE = PROCESSED_DATA / "pmpml_stops_clean.geojson"

OUTPUT_FILE = PROCESSED_DATA / "ward_features.geojson"


# ============================================================
# 2. SETTINGS
# ============================================================

POI_CATEGORIES = [
    "cafe",
    "restaurant",
    "fast_food",
    "hospital",
    "clinic",
    "pharmacy",
    "school",
    "college",
    "university",
    "gym",
    "supermarket",
    "convenience",
    "park",
]


# ============================================================
# 3. LOAD DATA
# ============================================================

print("=" * 60)
print("URBAN OPPORTUNITY MAPPER")
print("WARD FEATURE ENGINEERING")
print("=" * 60)

print("\nLoading ward data...")

wards = gpd.read_file(WARDS_FILE)

print(f"Wards loaded: {len(wards)}")

if len(wards) != 58:
    raise ValueError(
        f"Expected 58 wards, found {len(wards)}."
    )


print("\nLoading OSM POIs...")

pois = gpd.read_file(POIS_FILE)

print(f"POIs loaded: {len(pois)}")


print("\nLoading PMPML stops...")

pmpml = gpd.read_file(PMPML_FILE)

print(f"PMPML stops loaded: {len(pmpml)}")


# ============================================================
# 4. CRS STANDARDIZATION
# ============================================================

print("\nStandardizing CRS...")

wards = wards.to_crs("EPSG:4326")
pois = pois.to_crs("EPSG:4326")
pmpml = pmpml.to_crs("EPSG:4326")


# ============================================================
# 5. VALIDATE GEOMETRIES
# ============================================================

print("\nChecking geometries...")

print(
    f"Ward invalid geometries: "
    f"{(~wards.geometry.is_valid).sum()}"
)

print(
    f"POI invalid geometries: "
    f"{(~pois.geometry.is_valid).sum()}"
)

print(
    f"PMPML invalid geometries: "
    f"{(~pmpml.geometry.is_valid).sum()}"
)


# ============================================================
# 6. ASSIGN OSM POIs TO WARDS
# ============================================================

print("\nAssigning OSM POIs to wards...")

poi_join = gpd.sjoin(
    pois,
    wards[["ward_id", "geometry"]],
    how="left",
    predicate="within",
)

print(
    f"POIs assigned to wards: "
    f"{poi_join['ward_id'].notna().sum()}"
)

print(
    f"POIs outside ward boundaries: "
    f"{poi_join['ward_id'].isna().sum()}"
)


# ============================================================
# 7. COUNT POIs BY WARD AND CATEGORY
# ============================================================

print("\nCreating POI feature counts...")

poi_counts = (
    poi_join
    .dropna(subset=["ward_id"])
    .groupby(["ward_id", "category"])
    .size()
    .unstack(fill_value=0)
    .reset_index()
)


# Make sure every expected category exists.

for category in POI_CATEGORIES:

    if category not in poi_counts.columns:
        poi_counts[category] = 0


# Keep only the categories we want.

poi_counts = poi_counts[
    ["ward_id"] + POI_CATEGORIES
].copy()


# ============================================================
# 8. ADD TOTAL POI COUNT
# ============================================================

poi_counts["total_pois"] = (
    poi_counts[POI_CATEGORIES]
    .sum(axis=1)
)


# ============================================================
# 9. ASSIGN PMPML STOPS TO WARDS
# ============================================================

print("\nAssigning PMPML stops to wards...")

pmpml_join = gpd.sjoin(
    pmpml,
    wards[["ward_id", "geometry"]],
    how="left",
    predicate="within",
)

print(
    f"PMPML stops assigned: "
    f"{pmpml_join['ward_id'].notna().sum()}"
)

print(
    f"PMPML stops outside ward boundaries: "
    f"{pmpml_join['ward_id'].isna().sum()}"
)


# ============================================================
# 10. COUNT PMPML STOPS
# ============================================================

stop_counts = (
    pmpml_join
    .dropna(subset=["ward_id"])
    .groupby("ward_id")
    .size()
    .reset_index(name="pmpml_stops")
)


# ============================================================
# 11. MERGE FEATURES INTO WARDS
# ============================================================

print("\nMerging features...")

features = wards.copy()

features = features.merge(
    poi_counts,
    on="ward_id",
    how="left",
    validate="one_to_one",
)

features = features.merge(
    stop_counts,
    on="ward_id",
    how="left",
    validate="one_to_one",
)


# ============================================================
# 12. FILL MISSING COUNTS WITH ZERO
# ============================================================

count_columns = POI_CATEGORIES + [
    "total_pois",
    "pmpml_stops",
]

for column in count_columns:

    features[column] = (
        features[column]
        .fillna(0)
        .astype(int)
    )


# ============================================================
# 13. POPULATION-BASED FEATURES
# ============================================================

print("\nCreating population-normalized features...")

for category in POI_CATEGORIES:

    features[f"{category}_per_10k"] = (
        features[category]
        / features["population"]
        * 10000
    )


features["pmpml_stops_per_10k"] = (
    features["pmpml_stops"]
    / features["population"]
    * 10000
)


# ============================================================
# 14. AREA-BASED FEATURES
# ============================================================

print("\nCreating area-normalized features...")

for category in POI_CATEGORIES:

    features[f"{category}_per_km2"] = (
        features[category]
        / features["area_km2"]
    )


features["pmpml_stops_per_km2"] = (
    features["pmpml_stops"]
    / features["area_km2"]
)


features["pois_per_km2"] = (
    features["total_pois"]
    / features["area_km2"]
)


# ============================================================
# 15. ROUND NUMERIC FEATURES
# ============================================================

numeric_columns = features.select_dtypes(
    include=["number"]
).columns

features[numeric_columns] = (
    features[numeric_columns]
    .round(4)
)


# ============================================================
# 16. VALIDATION
# ============================================================

print("\n" + "=" * 60)
print("FEATURE VALIDATION")
print("=" * 60)

print(f"\nFinal wards: {len(features)}")

print(
    f"Missing population: "
    f"{features['population'].isna().sum()}"
)

print(
    f"Missing POI totals: "
    f"{features['total_pois'].isna().sum()}"
)

print(
    f"Missing PMPML counts: "
    f"{features['pmpml_stops'].isna().sum()}"
)


print("\nTotal OSM POIs assigned:")

print(
    features["total_pois"].sum()
)


print("\nTotal PMPML stops assigned:")

print(
    features["pmpml_stops"].sum()
)


# ============================================================
# 17. SHOW SAMPLE FEATURES
# ============================================================

display_columns = [
    "ward_id",
    "Name1",
    "population",
    "population_density_per_km2",
    "restaurant",
    "hospital",
    "school",
    "pharmacy",
    "cafe",
    "supermarket",
    "pmpml_stops",
]

print("\nSample feature table:")

print(
    features[
        display_columns
    ].head(10).to_string(index=False)
)


# ============================================================
# 18. SAVE FEATURE DATASET
# ============================================================

features.to_file(
    OUTPUT_FILE,
    driver="GeoJSON"
)


print("\n" + "=" * 60)
print("FEATURE ENGINEERING COMPLETE!")
print("=" * 60)

print("\nSaved file:")

print(OUTPUT_FILE)