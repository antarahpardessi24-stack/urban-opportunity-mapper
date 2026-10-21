from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "ward_features.geojson"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "urban_opportunity_clusters.geojson"
)


# ============================================================
# LOAD DATA
# ============================================================

print("Loading ward features...")

gdf = gpd.read_file(INPUT_FILE)

print(f"Wards loaded: {len(gdf)}")


# ============================================================
# FEATURE GROUPS
# ============================================================

food_retail = [
    "restaurant_per_10k",
    "cafe_per_10k",
    "fast_food_per_10k",
    "supermarket_per_10k",
    "convenience_per_10k",
]

healthcare = [
    "hospital_per_10k",
    "clinic_per_10k",
    "pharmacy_per_10k",
]

education = [
    "school_per_10k",
    "college_per_10k",
    "university_per_10k",
]

lifestyle = [
    "gym_per_10k",
    "park_per_10k",
]

accessibility = [
    "pmpml_stops_per_10k",
    "pmpml_stops_per_km2",
]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def minmax(series):
    """
    Scale a pandas Series between 0 and 1.
    """
    scaler = MinMaxScaler()

    return scaler.fit_transform(
        series.fillna(0).values.reshape(-1, 1)
    ).flatten()


def group_score(df, columns):
    """
    Calculate the average normalized score
    for a group of features.
    """

    scores = []

    for column in columns:
        scores.append(
            minmax(df[column])
        )

    return np.mean(scores, axis=0)


# ============================================================
# DEMAND SCORE
# ============================================================

print("Calculating demand score...")

population_score = minmax(
    gdf["population"]
)

density_score = minmax(
    gdf["population_density_per_km2"]
)

gdf["demand_score"] = (
    0.60 * population_score
    + 0.40 * density_score
) * 100


# ============================================================
# SUPPLY CATEGORY SCORES
# ============================================================

print("Calculating supply scores...")

gdf["food_retail_score"] = (
    group_score(
        gdf,
        food_retail
    ) * 100
)

gdf["healthcare_score"] = (
    group_score(
        gdf,
        healthcare
    ) * 100
)

gdf["education_score"] = (
    group_score(
        gdf,
        education
    ) * 100
)

gdf["lifestyle_score"] = (
    group_score(
        gdf,
        lifestyle
    ) * 100
)


# ============================================================
# OVERALL SUPPLY SCORE
# ============================================================

gdf["supply_score"] = (
    0.35 * gdf["food_retail_score"]
    + 0.25 * gdf["healthcare_score"]
    + 0.25 * gdf["education_score"]
    + 0.15 * gdf["lifestyle_score"]
)


# ============================================================
# SUPPLY GAP
# ============================================================

print("Calculating supply gap...")

gdf["supply_gap"] = (
    gdf["demand_score"]
    - gdf["supply_score"]
)


# Convert supply gap to 0–100

gdf["supply_gap_score"] = minmax(
    gdf["supply_gap"]
) * 100


# ============================================================
# ACCESSIBILITY
# ============================================================

print("Calculating accessibility...")

gdf["accessibility_score"] = (
    group_score(
        gdf,
        accessibility
    ) * 100
)


# ============================================================
# OPPORTUNITY SCORE
# ============================================================

print("Calculating opportunity score...")

gdf["opportunity_score"] = (
    0.50 * gdf["demand_score"]
    + 0.30 * gdf["supply_gap_score"]
    + 0.20 * gdf["accessibility_score"]
)

gdf["opportunity_score"] = (
    gdf["opportunity_score"]
    .clip(0, 100)
)


# ============================================================
# OPPORTUNITY LEVEL
# ============================================================

print("Classifying opportunity levels...")

# Instead of arbitrary fixed thresholds,
# classify wards relative to the other Pune wards.

gdf["opportunity_level"] = pd.qcut(
    gdf["opportunity_score"],
    q=3,
    labels=[
        "Low",
        "Medium",
        "High"
    ],
    duplicates="drop"
)


# ============================================================
# ML CLUSTERING
# ============================================================

print("Running K-Means clustering...")

cluster_features = [
    "demand_score",
    "supply_score",
    "supply_gap_score",
    "accessibility_score",
]

X = gdf[
    cluster_features
].fillna(0)


# Normalize clustering features

scaler = MinMaxScaler()

X_scaled = scaler.fit_transform(X)


# K-Means

kmeans = KMeans(
    n_clusters=4,
    random_state=42,
    n_init=20,
)

gdf["cluster_id"] = (
    kmeans.fit_predict(X_scaled)
)


# ============================================================
# CLUSTER PROFILES
# ============================================================

cluster_summary = (
    gdf.groupby(
        "cluster_id",
        observed=True
    )[cluster_features]
    .mean()
)

print("\nCluster profiles:")

print(
    cluster_summary
    .round(2)
)


# ============================================================
# INTERPRET CLUSTERS RELATIVELY
# ============================================================

print(
    "\nInterpreting clusters..."
)

cluster_labels = {}


# Calculate median values across clusters

demand_median = (
    cluster_summary[
        "demand_score"
    ].median()
)

supply_median = (
    cluster_summary[
        "supply_score"
    ].median()
)

gap_median = (
    cluster_summary[
        "supply_gap_score"
    ].median()
)

accessibility_median = (
    cluster_summary[
        "accessibility_score"
    ].median()
)


# Assign meaningful labels based on
# relative characteristics of the clusters.

for cluster_id, row in cluster_summary.iterrows():

    demand = row["demand_score"]

    supply = row["supply_score"]

    gap = row["supply_gap_score"]

    accessibility_score = (
        row["accessibility_score"]
    )


    # --------------------------------------------------------
    # High demand + high supply gap
    # --------------------------------------------------------

    if (
        demand >= demand_median
        and gap >= gap_median
    ):

        label = (
            "High-Demand Underserved"
        )


    # --------------------------------------------------------
    # Strong accessibility + relatively low supply
    # --------------------------------------------------------

    elif (
        accessibility_score
        >= accessibility_median
        and supply
        < supply_median
    ):

        label = (
            "Accessible Underserved"
        )


    # --------------------------------------------------------
    # Strong supply + relatively low gap
    # --------------------------------------------------------

    elif (
        supply >= supply_median
        and gap < gap_median
    ):

        label = (
            "Well-Served"
        )


    # --------------------------------------------------------
    # Remaining cluster
    # --------------------------------------------------------

    else:

        label = (
            "Low-Supply Opportunity"
        )


    cluster_labels[
        cluster_id
    ] = label


# Map cluster labels to wards

gdf["cluster"] = (
    gdf["cluster_id"]
    .map(cluster_labels)
)


# ============================================================
# OPPORTUNITY CATEGORY
# ============================================================

print(
    "\nIdentifying opportunity categories..."
)


category_scores = {

    "Food & Retail":
        "food_retail_score",

    "Healthcare":
        "healthcare_score",

    "Education":
        "education_score",

    "Lifestyle":
        "lifestyle_score",
}


category_df = gdf[
    list(
        category_scores.values()
    )
].copy()


category_df.columns = list(
    category_scores.keys()
)


# The lowest supply category represents
# the potentially underserved opportunity area.

gdf["opportunity_category"] = (
    category_df.idxmin(axis=1)
)


# ============================================================
# OPPORTUNITY RANKING
# ============================================================

print(
    "\nCalculating opportunity ranking..."
)

gdf["opportunity_rank"] = (
    gdf["opportunity_score"]
    .rank(
        ascending=False,
        method="min"
    )
    .astype(int)
)


# ============================================================
# ROUND NUMERIC FEATURES
# ============================================================

numeric_columns = (
    gdf.select_dtypes(
        include="number"
    ).columns
)

gdf[numeric_columns] = (
    gdf[numeric_columns]
    .round(3)
)


# ============================================================
# SAVE OUTPUT
# ============================================================

gdf.to_file(
    OUTPUT_FILE,
    driver="GeoJSON"
)


# ============================================================
# FINAL RESULTS
# ============================================================

print(
    "\nModel complete!"
)

print(
    f"Output saved to:\n{OUTPUT_FILE}"
)


# ============================================================
# CLUSTER SUMMARY
# ============================================================

print(
    "\nCluster mapping:"
)

print(
    gdf[
        [
            "cluster_id",
            "cluster"
        ]
    ]
    .drop_duplicates()
    .sort_values("cluster_id")
    .to_string(index=False)
)


print(
    "\nCluster sizes:"
)

print(
    gdf[
        "cluster"
    ]
    .value_counts()
    .to_string()
)


# ============================================================
# OPPORTUNITY CATEGORY SUMMARY
# ============================================================

print(
    "\nOpportunity category counts:"
)

print(
    gdf[
        "opportunity_category"
    ]
    .value_counts()
    .to_string()
)


# ============================================================
# TOP 10 OPPORTUNITY WARDS
# ============================================================

print(
    "\nTop 10 opportunity wards:"
)

print(
    gdf[
        [
            "ward_id",
            "Name1",
            "opportunity_score",
            "opportunity_category",
            "opportunity_level",
            "cluster",
            "opportunity_rank",
        ]
    ]
    .sort_values(
        "opportunity_score",
        ascending=False
    )
    .head(10)
    .to_string(index=False)
)