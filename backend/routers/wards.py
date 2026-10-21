from pathlib import Path
import json

import geopandas as gpd
from fastapi import APIRouter, HTTPException


router = APIRouter(
    prefix="/api/wards",
    tags=["Wards"],
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

WARD_DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "urban_opportunity_clusters.geojson"
)

POI_DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "pois_clean.geojson"
)

PMPML_DATA_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "pmpml_stops_clean.geojson"
)


def load_wards():
    """Load the processed ward dataset."""
    if not WARD_DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="Urban opportunity dataset not found.",
        )

    try:
        return gpd.read_file(WARD_DATA_FILE)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load ward data: {str(e)}",
        )


def get_single_ward(ward_id: int):
    """Return a single ward GeoDataFrame."""
    gdf = load_wards()

    ward = gdf[gdf["ward_id"] == ward_id]

    if ward.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Ward {ward_id} not found.",
        )

    return ward


@router.get("")
def get_all_wards():
    """Return all wards as GeoJSON."""
    gdf = load_wards()

    try:
        geojson = gdf.to_json()
        return json.loads(geojson)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert ward data to GeoJSON: {str(e)}",
        )


@router.get("/pois/all")
def get_all_pois():
    """Return all cleaned POIs as GeoJSON."""
    if not POI_DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="POI dataset not found.",
        )

    try:
        gdf = gpd.read_file(POI_DATA_FILE)

        geojson = gdf.to_json()

        return json.loads(geojson)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load POI data: {str(e)}",
        )


@router.get("/{ward_id}/pois")
def get_ward_pois(ward_id: int):
    """
    Return all POIs located inside the selected ward.
    """
    if not POI_DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="POI dataset not found.",
        )

    ward = get_single_ward(ward_id)

    try:
        pois = gpd.read_file(POI_DATA_FILE)

        # Make sure both datasets use the same CRS.
        if pois.crs != ward.crs:
            pois = pois.to_crs(ward.crs)

        # Spatial join: keep POIs that fall inside the ward.
        ward_boundary = ward[["ward_id", "geometry"]]

        ward_pois = gpd.sjoin(
            pois,
            ward_boundary,
            how="inner",
            predicate="within",
        )

        # Remove spatial join helper columns.
        columns_to_drop = [
            column
            for column in ["index_right"]
            if column in ward_pois.columns
        ]

        if columns_to_drop:
            ward_pois = ward_pois.drop(columns=columns_to_drop)

        geojson = ward_pois.to_json()

        return json.loads(geojson)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load ward POIs: {str(e)}",
        )


@router.get("/{ward_id}/stops")
def get_ward_stops(ward_id: int):
    """
    Return all PMPML stops located inside the selected ward.
    """
    if not PMPML_DATA_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="PMPML stops dataset not found.",
        )

    ward = get_single_ward(ward_id)

    try:
        stops = gpd.read_file(PMPML_DATA_FILE)

        # Make sure both datasets use the same CRS.
        if stops.crs != ward.crs:
            stops = stops.to_crs(ward.crs)

        # Spatial join: keep stops that fall inside the ward.
        ward_boundary = ward[["ward_id", "geometry"]]

        ward_stops = gpd.sjoin(
            stops,
            ward_boundary,
            how="inner",
            predicate="within",
        )

        # Remove spatial join helper columns.
        columns_to_drop = [
            column
            for column in ["index_right"]
            if column in ward_stops.columns
        ]

        if columns_to_drop:
            ward_stops = ward_stops.drop(columns=columns_to_drop)

        geojson = ward_stops.to_json()

        return json.loads(geojson)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load ward PMPML stops: {str(e)}",
        )


@router.get("/{ward_id}")
def get_ward(ward_id: int):
    """Return one ward as a GeoJSON Feature."""
    ward = get_single_ward(ward_id)

    try:
        feature = json.loads(
            ward.to_json()
        )["features"][0]

        return feature

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert ward data to GeoJSON: {str(e)}",
        )