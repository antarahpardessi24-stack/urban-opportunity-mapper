from pathlib import Path
import time

import geopandas as gpd
import pandas as pd
import requests


# ============================================================
# 1. PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

PROCESSED_DATA = PROJECT_ROOT / "data" / "processed"

WARDS_FILE = PROCESSED_DATA / "wards_clean.geojson"
OUTPUT_FILE = PROCESSED_DATA / "ward_population.geojson"


# ============================================================
# 2. WORLDPOP API SETTINGS
# ============================================================

API_URL = "https://api.worldpop.org/v2"

WORLDPOP_YEAR = 2020
WORLDPOP_RESOLUTION = "100m"


# ============================================================
# 3. LOAD CURRENT 58 WARDS
# ============================================================

print("=" * 60)
print("URBAN OPPORTUNITY MAPPER")
print("WORLDPOP POPULATION PROCESSING")
print("=" * 60)

print("\nLoading current Pune wards...")

wards = gpd.read_file(WARDS_FILE)

print(f"Number of wards: {len(wards)}")
print(f"CRS: {wards.crs}")

print("\nWard columns:")
print(wards.columns.tolist())


# ============================================================
# 4. VALIDATE WARDS
# ============================================================

if len(wards) != 58:
    raise ValueError(
        f"Expected 58 current Pune wards, but found {len(wards)}."
    )

if wards.crs is None:
    raise ValueError("Ward dataset has no CRS.")

# WorldPop API expects WGS84
wards = wards.to_crs("EPSG:4326")


invalid_geometries = (~wards.geometry.is_valid).sum()

print(f"\nInvalid geometries: {invalid_geometries}")

if invalid_geometries > 0:
    print("Repairing invalid geometries...")
    wards["geometry"] = wards.geometry.make_valid()


# ============================================================
# 5. WORLDPOP API FUNCTION
# ============================================================

def get_population(geometry, ward_id):
    """
    Send one ward polygon to WorldPop API
    and retrieve population statistics.
    """

    payload = {
        "geojson": geometry.__geo_interface__,
        "year": WORLDPOP_YEAR,
        "resolution": WORLDPOP_RESOLUTION,
    }

    print(f"\nProcessing ward {ward_id}...")

    response = requests.post(
        f"{API_URL}/population",
        json=payload,
        timeout=120,
    )

    response.raise_for_status()

    response_data = response.json()

    if "task_id" not in response_data:
        raise RuntimeError(
            f"WorldPop API did not return a task ID:\n"
            f"{response_data}"
        )

    task_id = response_data["task_id"]

    print(f"Task ID: {task_id}")

    # --------------------------------------------------------
    # Poll until WorldPop finishes processing
    # --------------------------------------------------------

    task_url = f"{API_URL}/tasks/{task_id}"

    while True:

        task_response = requests.get(
            task_url,
            timeout=60,
        )

        task_response.raise_for_status()

        result = task_response.json()

        status = result.get("status")

        print(f"Status: {status}")

        if status == "success":

            population_result = result["result"]

            return {
                "population": population_result["total_population"],
                "population_density": population_result[
                    "population_density"
                ],
                "area_km2": population_result["area_km2"],
            }

        if status == "failure":

            error_message = result.get(
                "error",
                "Unknown WorldPop API error"
            )

            raise RuntimeError(
                f"WorldPop processing failed for ward "
                f"{ward_id}: {error_message}"
            )

        time.sleep(2)


# ============================================================
# 6. PROCESS ALL 58 WARDS
# ============================================================

population_results = []

total_wards = len(wards)

print("\n" + "=" * 60)
print("STARTING WORLDPOP PROCESSING")
print("=" * 60)

for index, row in wards.iterrows():

    ward_id = int(row["ward_id"])

    try:

        result = get_population(
            row.geometry,
            ward_id
        )

        population_results.append({
            "ward_id": ward_id,
            "population": result["population"],
            "worldpop_area_km2": result["area_km2"],
            "worldpop_density": result[
                "population_density"
            ],
        })

        print(
            f"Completed {index + 1}/{total_wards} "
            f"| Ward {ward_id} "
            f"| Population: "
            f"{result['population']:,.0f}"
        )

    except Exception as error:

        print(
            f"\nERROR processing ward {ward_id}:"
        )
        print(error)

        raise


# ============================================================
# 7. CREATE POPULATION DATAFRAME
# ============================================================

population_df = pd.DataFrame(population_results)

print("\n" + "=" * 60)
print("POPULATION RESULTS")
print("=" * 60)

print(population_df)


# ============================================================
# 8. MERGE WITH WARD GEOMETRIES
# ============================================================

wards = wards.merge(
    population_df,
    on="ward_id",
    how="left",
    validate="one_to_one",
)


# ============================================================
# 9. CALCULATE POPULATION DENSITY
# ============================================================

# Use our previously calculated ward area.
wards["population_density_per_km2"] = (
    wards["population"]
    / wards["area_km2"]
)


# ============================================================
# 10. ROUND NUMERIC VALUES
# ============================================================

wards["population"] = wards["population"].round(2)

wards["worldpop_area_km2"] = (
    wards["worldpop_area_km2"].round(4)
)

wards["worldpop_density"] = (
    wards["worldpop_density"].round(2)
)

wards["population_density_per_km2"] = (
    wards["population_density_per_km2"].round(2)
)


# ============================================================
# 11. SAVE OUTPUT
# ============================================================

wards.to_file(
    OUTPUT_FILE,
    driver="GeoJSON"
)


# ============================================================
# 12. FINAL VALIDATION
# ============================================================

print("\n" + "=" * 60)
print("FINAL VALIDATION")
print("=" * 60)

print(f"\nFinal ward count: {len(wards)}")

print(
    f"Missing population values: "
    f"{wards['population'].isna().sum()}"
)

print(
    f"Minimum population: "
    f"{wards['population'].min():,.0f}"
)

print(
    f"Maximum population: "
    f"{wards['population'].max():,.0f}"
)

print(
    f"Total estimated population: "
    f"{wards['population'].sum():,.0f}"
)

print("\nPopulation density statistics:")

print(
    wards["population_density_per_km2"]
    .describe()
)


print("\nSaved file:")

print(OUTPUT_FILE)

print("\n" + "=" * 60)
print("WORLDPOP PROCESSING COMPLETE!")
print("=" * 60)