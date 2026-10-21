from pathlib import Path
import geopandas as gpd
import pandas as pd
import zipfile


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DATA = PROJECT_ROOT / "data" / "raw"

WARD_FILE = RAW_DATA / "pune-2022-wards.geojson"
OSM_FILE = RAW_DATA / "osm" / "pune_pois.geojson"
PMPML_FILE = RAW_DATA / "pmpml" / "pmpml_gtfs.zip"
CENSUS_FILE = RAW_DATA / "census" / "DDW_PCA2725_2011_MDDS with UI.xlsx"


# ============================================================
# 1. PUNE WARD DATA
# ============================================================

print("\n" + "=" * 60)
print("1. PUNE WARD DATA")
print("=" * 60)

wards = gpd.read_file(WARD_FILE)

print("Rows:", len(wards))
print("Columns:")
print(wards.columns.tolist())

print("\nCRS:")
print(wards.crs)

print("\nGeometry types:")
print(wards.geometry.geom_type.value_counts())

print("\nFirst 5 rows:")
print(wards.head())


# ============================================================
# 2. OPENSTREETMAP POIs
# ============================================================

print("\n" + "=" * 60)
print("2. OPENSTREETMAP POIs")
print("=" * 60)

pois = gpd.read_file(OSM_FILE)

print("Rows:", len(pois))
print("Columns:")
print(pois.columns.tolist())

print("\nCRS:")
print(pois.crs)

print("\nGeometry types:")
print(pois.geometry.geom_type.value_counts())

print("\nFirst 5 rows:")
print(pois.head())


# ============================================================
# 3. PMPML GTFS
# ============================================================

print("\n" + "=" * 60)
print("3. PMPML GTFS")
print("=" * 60)

with zipfile.ZipFile(PMPML_FILE, "r") as zip_ref:
    files = zip_ref.namelist()

print("Files inside GTFS:")
for file in files:
    print("  -", file)


# ============================================================
# 4. CENSUS
# ============================================================

print("\n" + "=" * 60)
print("4. CENSUS INDIA")
print("=" * 60)

excel = pd.ExcelFile(CENSUS_FILE)

print("Sheets:")
for sheet in excel.sheet_names:
    print("  -", sheet)

print("\nReading first sheet...")

census = pd.read_excel(
    CENSUS_FILE,
    sheet_name=excel.sheet_names[0]
)

print("Rows:", len(census))
print("Columns:", len(census.columns))

print("\nColumn names:")
print(census.columns.tolist())

print("\nFirst 5 rows:")
print(census.head())


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 60)
print("DATA INSPECTION COMPLETE")
print("=" * 60)