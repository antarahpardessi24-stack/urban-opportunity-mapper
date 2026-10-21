import geopandas as gpd
import numpy as np
import pandas as pd
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path("data/processed/ward_features.geojson")
OUTPUT_FILE = Path("data/processed/opportunity_scores.geojson")


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def min_max_score(series):
    """
    Convert a numerical series to a 0-100 score.
    Higher original value = higher score.
    """
    min_value = series.min()
    max_value = series.max()

    if max_value == min_value:
        return pd.Series(50.0, index=series.index)

    return ((series - min_value) / (max_value - min_value)) * 100


def inverse_min_max_score(series):
    """
    Convert a numerical series to a 0-100 score.
    Lower original value = higher score.
    Useful for identifying supply gaps.
    """
    min_value = series.min()
    max_value = series.max()

    if max_value == min_value:
        return pd.Series(50.0, index=series.index)

    return ((max_value - series) / (max_value - min_value)) * 100


def percentile_score(series):
    """
    Convert values to percentile-based 0-100 scores.
    More robust to extreme outliers than min-max scaling.
    """
    return series.rank(pct=True) * 100


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("URBAN OPPORTUNITY MAPPER")
print("Opportunity Scoring Engine")
print("=" * 60)

print("\nLoading ward features...")

gdf = gpd.read_file(INPUT_FILE)

print(f"Wards loaded: {len(gdf)}")


# ============================================================
# VALIDATION
# ============================================================

required_columns = [
    "ward_id",
    "population",
    "population_density_per_km2",
    "pmpml_stops_per_10k",

    # Healthcare
    "hospital_per_10k",
    "clinic_per_10k",
    "pharmacy_per_10k",

    # Education
    "school_per_10k",
    "college_per_10k",
    "university_per_10k",

    # Food & Lifestyle
    "cafe_per_10k",
    "restaurant_per_10k",
    "fast_food_per_10k",
    "gym_per_10k",

    # Daily Needs
    "supermarket_per_10k",
    "convenience_per_10k",

    # Recreation
    "park_per_10k",
]

missing_columns = [
    column for column in required_columns
    if column not in gdf.columns
]

if missing_columns:
    raise ValueError(
        f"Missing required columns: {missing_columns}"
    )

print("Column validation: PASSED")


# ============================================================
# DEMAND SCORE
# ============================================================

print("\nCalculating demand score...")

population_score = percentile_score(
    gdf["population"]
)

density_score = percentile_score(
    gdf["population_density_per_km2"]
)

gdf["demand_score"] = (
    0.60 * population_score +
    0.40 * density_score
)


# ============================================================
# CATEGORY SUPPLY SCORES
# ============================================================

print("Calculating category supply gaps...")


# -------------------------
# Healthcare
# -------------------------

gdf["healthcare_supply"] = (
    0.40 * gdf["hospital_per_10k"] +
    0.35 * gdf["clinic_per_10k"] +
    0.25 * gdf["pharmacy_per_10k"]
)

gdf["healthcare_gap"] = inverse_min_max_score(
    gdf["healthcare_supply"]
)


# -------------------------
# Education
# -------------------------

gdf["education_supply"] = (
    0.50 * gdf["school_per_10k"] +
    0.30 * gdf["college_per_10k"] +
    0.20 * gdf["university_per_10k"]
)

gdf["education_gap"] = inverse_min_max_score(
    gdf["education_supply"]
)


# -------------------------
# Food & Lifestyle
# -------------------------

gdf["food_supply"] = (
    0.30 * gdf["cafe_per_10k"] +
    0.35 * gdf["restaurant_per_10k"] +
    0.20 * gdf["fast_food_per_10k"] +
    0.15 * gdf["gym_per_10k"]
)

gdf["food_gap"] = inverse_min_max_score(
    gdf["food_supply"]
)


# -------------------------
# Daily Needs
# -------------------------

gdf["daily_needs_supply"] = (
    0.60 * gdf["supermarket_per_10k"] +
    0.40 * gdf["convenience_per_10k"]
)

gdf["daily_needs_gap"] = inverse_min_max_score(
    gdf["daily_needs_supply"]
)


# -------------------------
# Recreation
# -------------------------

gdf["recreation_supply"] = (
    gdf["park_per_10k"]
)

gdf["recreation_gap"] = inverse_min_max_score(
    gdf["recreation_supply"]
)


# ============================================================
# OVERALL SUPPLY GAP
# ============================================================

gdf["supply_gap_score"] = (
    0.25 * gdf["healthcare_gap"] +
    0.20 * gdf["education_gap"] +
    0.25 * gdf["food_gap"] +
    0.20 * gdf["daily_needs_gap"] +
    0.10 * gdf["recreation_gap"]
)


# ============================================================
# ACCESSIBILITY SCORE
# ============================================================

print("Calculating accessibility score...")

gdf["accessibility_score"] = percentile_score(
    gdf["pmpml_stops_per_10k"]
)


# ============================================================
# OPPORTUNITY SCORE
# ============================================================

print("Calculating overall opportunity score...")

gdf["opportunity_score"] = (
    0.40 * gdf["demand_score"] +
    0.40 * gdf["supply_gap_score"] +
    0.20 * gdf["accessibility_score"]
)


# ============================================================
# CATEGORY-SPECIFIC OPPORTUNITY SCORES
# ============================================================

gdf["healthcare_opportunity"] = (
    0.60 * gdf["demand_score"] +
    0.40 * gdf["healthcare_gap"]
)

gdf["education_opportunity"] = (
    0.60 * gdf["demand_score"] +
    0.40 * gdf["education_gap"]
)

gdf["food_opportunity"] = (
    0.60 * gdf["demand_score"] +
    0.40 * gdf["food_gap"]
)

gdf["daily_needs_opportunity"] = (
    0.60 * gdf["demand_score"] +
    0.40 * gdf["daily_needs_gap"]
)

gdf["recreation_opportunity"] = (
    0.60 * gdf["demand_score"] +
    0.40 * gdf["recreation_gap"]
)


# ============================================================
# PRIMARY OPPORTUNITY CATEGORY
# ============================================================

category_columns = {
    "Healthcare": "healthcare_opportunity",
    "Education": "education_opportunity",
    "Food & Lifestyle": "food_opportunity",
    "Daily Needs": "daily_needs_opportunity",
    "Recreation": "recreation_opportunity",
}

gdf["opportunity_category"] = (
    gdf[list(category_columns.values())]
    .idxmax(axis=1)
    .map({
        value: key
        for key, value in category_columns.items()
    })
)


# ============================================================
# OPPORTUNITY RANK
# ============================================================

gdf["opportunity_rank"] = (
    gdf["opportunity_score"]
    .rank(
        ascending=False,
        method="min"
    )
    .astype(int)
)


# ============================================================
# INTERPRETATION LABEL
# ============================================================

def opportunity_level(score):

    if score >= 80:
        return "Very High"

    elif score >= 65:
        return "High"

    elif score >= 50:
        return "Moderate"

    elif score >= 35:
        return "Low"

    else:
        return "Very Low"


gdf["opportunity_level"] = (
    gdf["opportunity_score"]
    .apply(opportunity_level)
)


# ============================================================
# ROUND NUMERIC FEATURES
# ============================================================

numeric_columns = gdf.select_dtypes(
    include=np.number
).columns

gdf[numeric_columns] = (
    gdf[numeric_columns]
    .round(3)
)


# ============================================================
# SAVE
# ============================================================

print("\nSaving opportunity scores...")

gdf.to_file(
    OUTPUT_FILE,
    driver="GeoJSON"
)

print(f"\nSaved successfully:")
print(OUTPUT_FILE)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("TOP 10 OPPORTUNITY WARDS")
print("=" * 60)

top10 = (
    gdf
    .sort_values("opportunity_score", ascending=False)
    .head(10)
)

print(
    top10[
        [
            "ward_id",
            "Name1",
            "Name2",
            "opportunity_score",
            "opportunity_level",
            "opportunity_category",
            "demand_score",
            "supply_gap_score",
            "accessibility_score",
        ]
    ].to_string(index=False)
)

print("\n" + "=" * 60)
print("OPPORTUNITY CATEGORY DISTRIBUTION")
print("=" * 60)

print(
    gdf["opportunity_category"]
    .value_counts()
)

print("\nScoring completed successfully!")