import geopandas as gpd
import pandas as pd
import numpy as np

from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score


# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/processed/opportunity_scores.geojson"
)

OUTPUT_FILE = Path(
    "data/processed/urban_opportunity_clusters.geojson"
)

# Test several cluster counts
K_VALUES = range(2, 9)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("URBAN OPPORTUNITY MAPPER")
print("ML CLUSTERING ENGINE")
print("=" * 60)

print("\nLoading opportunity data...")

gdf = gpd.read_file(INPUT_FILE)

print(f"Wards loaded: {len(gdf)}")


# ============================================================
# ML FEATURES
# ============================================================
# IMPORTANT:
# Use underlying characteristics rather than derived
# opportunity scores to avoid giving K-Means overlapping
# information.

feature_columns = [
    "population",
    "population_density_per_km2",

    "pmpml_stops_per_10k",

    "healthcare_gap",
    "education_gap",
    "food_gap",
    "daily_needs_gap",
    "recreation_gap",
]


# ============================================================
# VALIDATION
# ============================================================

missing_columns = [
    column
    for column in feature_columns
    if column not in gdf.columns
]

if missing_columns:
    raise ValueError(
        f"Missing ML features: {missing_columns}"
    )

print("\nML feature validation: PASSED")


# ============================================================
# PREPARE DATA
# ============================================================

X = gdf[feature_columns].copy()

X = X.replace(
    [np.inf, -np.inf],
    np.nan
)

X = X.fillna(
    X.median()
)


# ============================================================
# STANDARDIZATION
# ============================================================

print("\nStandardizing ML features...")

scaler = StandardScaler()

X_scaled = scaler.fit_transform(X)

print("Standardization completed.")


# ============================================================
# TEST K VALUES
# ============================================================

print("\n" + "=" * 60)
print("TESTING CLUSTER COUNTS")
print("=" * 60)

results = []

for k in K_VALUES:

    model = KMeans(
        n_clusters=k,
        random_state=42,
        n_init=20
    )

    labels = model.fit_predict(X_scaled)

    score = silhouette_score(
        X_scaled,
        labels
    )

    results.append(
        {
            "k": k,
            "silhouette_score": score
        }
    )

    print(
        f"K = {k} | "
        f"Silhouette Score = {score:.4f}"
    )


# ============================================================
# BEST K
# ============================================================

results_df = pd.DataFrame(results)

best_row = results_df.loc[
    results_df["silhouette_score"].idxmax()
]

best_k = int(best_row["k"])

best_silhouette = float(
    best_row["silhouette_score"]
)

print("\n" + "=" * 60)
print("BEST CLUSTER CONFIGURATION")
print("=" * 60)

print(f"Best K: {best_k}")
print(
    f"Silhouette Score: "
    f"{best_silhouette:.4f}"
)


# ============================================================
# FINAL MODEL
# ============================================================

print("\nTraining final K-Means model...")

final_model = KMeans(
    n_clusters=best_k,
    random_state=42,
    n_init=20
)

gdf["cluster_id"] = (
    final_model.fit_predict(X_scaled)
)

print("Clustering completed.")


# ============================================================
# CLUSTER PROFILE
# ============================================================

print("\n" + "=" * 60)
print("CLUSTER PROFILES")
print("=" * 60)

profile_columns = [
    "population",
    "population_density_per_km2",
    "pmpml_stops_per_10k",
    "healthcare_gap",
    "education_gap",
    "food_gap",
    "daily_needs_gap",
    "recreation_gap",
    "opportunity_score",
]

cluster_profile = (
    gdf
    .groupby("cluster_id")[profile_columns]
    .mean()
    .round(2)
)

print(
    cluster_profile.to_string()
)


# ============================================================
# CLUSTER LABELING
# ============================================================

print("\nGenerating cluster archetypes...")


overall = gdf[profile_columns].mean()


def label_cluster(row):

    opportunity = row["opportunity_score"]

    demand_proxy = (
        0.6 * row["population"]
        / overall["population"]
        +
        0.4 * row["population_density_per_km2"]
        / overall["population_density_per_km2"]
    )

    avg_gap = np.mean([
        row["healthcare_gap"],
        row["education_gap"],
        row["food_gap"],
        row["daily_needs_gap"],
        row["recreation_gap"],
    ])

    accessibility = row["pmpml_stops_per_10k"]

    mean_accessibility = (
        overall["pmpml_stops_per_10k"]
    )

    if (
        demand_proxy > 1.10
        and avg_gap > 70
    ):
        return "High-Demand Underserved"

    if (
        opportunity >= 65
        and accessibility >= mean_accessibility
        and avg_gap >= 65
    ):
        return "Transit-Accessible Opportunity"

    if (
        demand_proxy >= 1.10
        and avg_gap < 50
    ):
        return "High-Density Established"

    if (
        avg_gap >= 75
        and demand_proxy < 0.90
    ):
        return "Emerging Low-Supply"

    if (
        opportunity < 50
        and avg_gap < 65
    ):
        return "Lower-Opportunity"

    return "Mixed Urban Profile"


cluster_labels = {}

for cluster_id, row in cluster_profile.iterrows():

    cluster_labels[cluster_id] = label_cluster(row)


gdf["cluster_archetype"] = (
    gdf["cluster_id"]
    .map(cluster_labels)
)


# ============================================================
# CLUSTER RANK
# ============================================================

cluster_opportunity = (
    gdf
    .groupby("cluster_id")["opportunity_score"]
    .mean()
    .sort_values(
        ascending=False
    )
)

cluster_rank = {
    cluster_id: rank
    for rank, cluster_id
    in enumerate(
        cluster_opportunity.index,
        start=1
    )
}

gdf["cluster_rank"] = (
    gdf["cluster_id"]
    .map(cluster_rank)
)


# ============================================================
# SAVE
# ============================================================

print("\nSaving clustered wards...")

gdf.to_file(
    OUTPUT_FILE,
    driver="GeoJSON"
)

print(
    f"Saved successfully:\n"
    f"{OUTPUT_FILE}"
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("CLUSTER SUMMARY")
print("=" * 60)

for cluster_id in sorted(
    gdf["cluster_id"].unique()
):

    rows = gdf[
        gdf["cluster_id"] == cluster_id
    ]

    print(
        f"\nCluster {cluster_id}"
    )

    print(
        f"Archetype: "
        f"{cluster_labels[cluster_id]}"
    )

    print(
        f"Wards: {len(rows)}"
    )

    print(
        f"Average Opportunity Score: "
        f"{rows['opportunity_score'].mean():.2f}"
    )

    print(
        "Top wards:"
    )

    print(
        rows
        .sort_values(
            "opportunity_score",
            ascending=False
        )
        [
            [
                "ward_id",
                "Name1",
                "opportunity_score"
            ]
        ]
        .head(3)
        .to_string(index=False)
    )


print("\n" + "=" * 60)
print("ML CLUSTERING COMPLETED SUCCESSFULLY")
print("=" * 60)