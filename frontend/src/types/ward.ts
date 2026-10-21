import type {
  Feature,
  FeatureCollection,
  Geometry,
} from "geojson";

export type OpportunityLevel =
  | "Low"
  | "Medium"
  | "High";

export type OpportunityCategory =
  | "Education"
  | "Healthcare"
  | "Food & Retail"
  | "Lifestyle";

export type OpportunityCluster =
  | "High-Demand Underserved"
  | "Accessible Underserved"
  | "Well-Served"
  | "Low-Supply Opportunity";

export interface WardProperties {
  ward_id: number;
  Name1: string;
  Name2: string;

  area_km2?: number;

  population: number;
  worldpop_area_km2?: number;
  worldpop_density?: number;
  population_density_per_km2: number;

  cafe: number;
  restaurant: number;
  fast_food: number;

  hospital: number;
  clinic: number;
  pharmacy: number;

  school: number;
  college: number;
  university: number;

  gym: number;
  supermarket: number;
  convenience: number;
  park: number;

  total_pois: number;
  pmpml_stops: number;

  demand_score: number;
  food_retail_score?: number;
  healthcare_score?: number;
  education_score?: number;
  lifestyle_score?: number;

  supply_score: number;
  supply_gap: number;
  supply_gap_score: number;
  accessibility_score: number;
  opportunity_score: number;

  opportunity_level: OpportunityLevel;
  opportunity_category: OpportunityCategory;

  // Actual ML clustering field returned by the API
  cluster_id: number;
  cluster: OpportunityCluster;
  cluster_rank?: number;

  opportunity_rank: number;
}

export type WardFeature = Feature<
  Geometry,
  WardProperties
>;

export type WardGeoJSON = FeatureCollection<
  Geometry,
  WardProperties
>;