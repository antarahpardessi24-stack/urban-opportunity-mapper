from pathlib import Path
import zipfile

import pandas as pd
import geopandas as gpd


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

RAW_DATA = PROJECT_ROOT / "data" / "raw"
PROCESSED_DATA = PROJECT_ROOT / "data" / "processed"

WARD_FILE = RAW_DATA / "pune-2022-wards.geojson"
OUTPUT_FILE = PROCESSED_DATA / "wards_clean.geojson"

PMPML_FILE = RAW_DATA / "pmpml" / "pmpml_gtfs.zip"
PMPML_OUTPUT = PROCESSED_DATA / "pmpml_stops_clean.geojson"


# Create processed directory if it doesn't exist
PROCESSED_DATA.mkdir(parents=True, exist_ok=True)


# ============================================================
# 1. LOAD RAW WARDS
# ============================================================

print("\nLoading Pune ward boundaries...")

wards = gpd.read_file(WARD_FILE)

print(f"Original rows: {len(wards)}")
print(f"Original CRS: {wards.crs}")


# ============================================================
# 2. CHECK FOR MISSING WARD IDs
# ============================================================

print("\nChecking ward IDs...")

missing_ids = wards["wardnum"].isna().sum()

print(f"Missing ward IDs: {missing_ids}")


# ============================================================
# 3. STANDARDIZE WARD ID
# ============================================================

wards["ward_id"] = wards["wardnum"].astype(int)


# ============================================================
# 4. CHECK FOR DUPLICATE WARDS
# ============================================================

duplicates = wards["ward_id"].duplicated().sum()

print(f"Duplicate ward IDs: {duplicates}")


# ============================================================
# 5. CHECK GEOMETRIES
# ============================================================

print("\nChecking geometries...")

invalid_before = (~wards.geometry.is_valid).sum()

print(f"Invalid geometries before cleaning: {invalid_before}")


# Fix invalid geometries if any exist
wards["geometry"] = wards.geometry.make_valid()

invalid_after = (~wards.geometry.is_valid).sum()

print(f"Invalid geometries after cleaning: {invalid_after}")


# ============================================================
# 6. REMOVE UNNECESSARY COLUMNS
# ============================================================

wards = wards[
    [
        "ward_id",
        "Name1",
        "Name2",
        "geometry"
    ]
].copy()


# ============================================================
# 7. CALCULATE WARD AREA
# ============================================================

# Project to a metric CRS before calculating area.
# EPSG:32643 = UTM Zone 43N, appropriate for Pune.

wards_metric = wards.to_crs(epsg=32643)

wards["area_km2"] = (
    wards_metric.geometry.area / 1_000_000
)


# ============================================================
# 8. SORT BY WARD ID
# ============================================================

wards = wards.sort_values(
    "ward_id"
).reset_index(drop=True)


# ============================================================
# 9. FINAL VALIDATION
# ============================================================

print("\nFinal ward dataset:")

print(f"Number of wards: {len(wards)}")
print(f"CRS: {wards.crs}")

print("\nColumns:")
print(wards.columns.tolist())

print("\nWard area statistics:")
print(wards["area_km2"].describe())


# ============================================================
# 10. SAVE PROCESSED WARD DATA
# ============================================================

wards.to_file(
    OUTPUT_FILE,
    driver="GeoJSON"
)

print("\nSaved cleaned ward dataset:")
print(OUTPUT_FILE)

print("\nWARD CLEANING COMPLETE!")


# ============================================================
# 11. CLEAN OPENSTREETMAP POIs
# ============================================================

print("\n" + "=" * 60)
print("CLEANING OPENSTREETMAP POIs")
print("=" * 60)


OSM_FILE = RAW_DATA / "osm" / "pune_pois.geojson"
OSM_OUTPUT = PROCESSED_DATA / "pois_clean.geojson"


print("\nLoading OSM POIs...")

pois = gpd.read_file(OSM_FILE)

print(f"Original POIs: {len(pois)}")
print(f"Original columns: {len(pois.columns)}")
print(f"CRS: {pois.crs}")


# ------------------------------------------------------------
# Create standardized category
# ------------------------------------------------------------

def classify_poi(row):

    amenity = str(row.get("amenity", "")).lower()
    leisure = str(row.get("leisure", "")).lower()
    shop = str(row.get("shop", "")).lower()

    if amenity == "cafe":
        return "cafe"

    if amenity == "restaurant":
        return "restaurant"

    if amenity == "fast_food":
        return "fast_food"

    if amenity == "hospital":
        return "hospital"

    if amenity == "clinic":
        return "clinic"

    if amenity == "pharmacy":
        return "pharmacy"

    if amenity == "school":
        return "school"

    if amenity == "college":
        return "college"

    if amenity == "university":
        return "university"

    if leisure == "fitness_centre":
        return "gym"

    if shop == "supermarket":
        return "supermarket"

    if shop == "convenience":
        return "convenience"

    if leisure == "park":
        return "park"

    return "other"


pois["category"] = pois.apply(
    classify_poi,
    axis=1
)


# ------------------------------------------------------------
# Keep useful fields
# ------------------------------------------------------------

keep_columns = [
    "id",
    "name",
    "category",
    "amenity",
    "leisure",
    "shop",
    "geometry"
]


# Keep only columns that actually exist
keep_columns = [
    column
    for column in keep_columns
    if column in pois.columns
]

pois = pois[keep_columns].copy()


# ------------------------------------------------------------
# Remove invalid geometries
# ------------------------------------------------------------

invalid = (~pois.geometry.is_valid).sum()

print(f"Invalid geometries: {invalid}")

pois = pois[
    pois.geometry.notna()
].copy()

pois = pois[
    pois.geometry.is_valid
].copy()


# ------------------------------------------------------------
# Remove duplicates
# ------------------------------------------------------------

before = len(pois)

pois = pois.drop_duplicates(
    subset=["geometry", "category"]
)

after = len(pois)

print(f"Duplicates removed: {before - after}")


# ------------------------------------------------------------
# Final category distribution
# ------------------------------------------------------------

print("\nPOIs by category:")

print(
    pois["category"]
    .value_counts()
    .sort_index()
)


# ------------------------------------------------------------
# Final dataset
# ------------------------------------------------------------

print("\nFinal POI count:", len(pois))

print(
    "Final columns:",
    pois.columns.tolist()
)


# ------------------------------------------------------------
# Save
# ------------------------------------------------------------

pois.to_file(
    OSM_OUTPUT,
    driver="GeoJSON"
)

print("\nSaved cleaned OSM dataset:")
print(OSM_OUTPUT)


# ============================================================
# 12. CLEAN PMPML GTFS STOPS
# ============================================================

print("\n" + "=" * 60)
print("CLEANING PMPML GTFS STOPS")
print("=" * 60)


print("\nLoading PMPML GTFS stops...")


# ------------------------------------------------------------
# Open GTFS ZIP
# ------------------------------------------------------------

with zipfile.ZipFile(PMPML_FILE, "r") as z:

    print("GTFS files found:")
    print(z.namelist())

    if "stops.txt" not in z.namelist():
        raise FileNotFoundError(
            "stops.txt was not found inside PMPML GTFS ZIP"
        )

    with z.open("stops.txt") as f:

        stops = pd.read_csv(f)


print(f"\nOriginal stops: {len(stops)}")

print("Columns:")
print(stops.columns.tolist())


# ------------------------------------------------------------
# Check required columns
# ------------------------------------------------------------

required_columns = [
    "stop_id",
    "stop_name",
    "stop_lat",
    "stop_lon"
]

missing_columns = [
    column
    for column in required_columns
    if column not in stops.columns
]

if missing_columns:

    raise ValueError(
        f"Missing required columns: {missing_columns}"
    )


# ------------------------------------------------------------
# Clean coordinates
# ------------------------------------------------------------

stops["stop_lat"] = pd.to_numeric(
    stops["stop_lat"],
    errors="coerce"
)

stops["stop_lon"] = pd.to_numeric(
    stops["stop_lon"],
    errors="coerce"
)


# Remove rows with missing coordinates

before_missing = len(stops)

stops = stops.dropna(
    subset=[
        "stop_lat",
        "stop_lon"
    ]
)

print(
    "Rows removed due to missing coordinates:",
    before_missing - len(stops)
)


# ------------------------------------------------------------
# Validate coordinates
# ------------------------------------------------------------

valid_coordinates = (
    stops["stop_lat"].between(-90, 90)
    &
    stops["stop_lon"].between(-180, 180)
)

invalid_coordinates = (
    ~valid_coordinates
).sum()

print(
    "Invalid coordinate rows:",
    invalid_coordinates
)

stops = stops[
    valid_coordinates
].copy()


# ------------------------------------------------------------
# Remove duplicate stop IDs
# ------------------------------------------------------------

before_duplicates = len(stops)

stops = stops.drop_duplicates(
    subset=["stop_id"]
)

print(
    "Duplicate stops removed:",
    before_duplicates - len(stops)
)


# ------------------------------------------------------------
# Convert to GeoDataFrame
# ------------------------------------------------------------

pmpml_stops = gpd.GeoDataFrame(
    stops,
    geometry=gpd.points_from_xy(
        stops["stop_lon"],
        stops["stop_lat"]
    ),
    crs="EPSG:4326"
)


# ------------------------------------------------------------
# Check geometries
# ------------------------------------------------------------

invalid_geometries = (
    ~pmpml_stops.geometry.is_valid
).sum()

print(
    "Invalid geometries:",
    invalid_geometries
)


pmpml_stops = pmpml_stops[
    pmpml_stops.geometry.notna()
].copy()

pmpml_stops = pmpml_stops[
    pmpml_stops.geometry.is_valid
].copy()


# ------------------------------------------------------------
# Keep useful GTFS columns
# ------------------------------------------------------------

keep_columns = [
    "stop_id",
    "stop_code",
    "stop_name",
    "stop_desc",
    "stop_lat",
    "stop_lon",
    "location_type",
    "parent_station",
    "geometry"
]


# Keep only columns that actually exist

keep_columns = [
    column
    for column in keep_columns
    if column in pmpml_stops.columns
]

pmpml_stops = pmpml_stops[
    keep_columns
].copy()


# ------------------------------------------------------------
# Final information
# ------------------------------------------------------------

print("\nFinal PMPML stop count:")

print(len(pmpml_stops))

print("\nFinal columns:")

print(
    pmpml_stops.columns.tolist()
)


# ------------------------------------------------------------
# Save cleaned PMPML stops
# ------------------------------------------------------------

pmpml_stops.to_file(
    PMPML_OUTPUT,
    driver="GeoJSON"
)


print("\nSaved cleaned PMPML stops:")

print(PMPML_OUTPUT)

print("\nPMPML STOP CLEANING COMPLETE!")