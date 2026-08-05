export const stackHeadline: string[] = [
  "Snowflake",
  "Airflow",
  "dbt",
  "Terraform",
  "Kubernetes",
  "Python",
  "AI Agents & MCP",
];

export interface SkillCategory {
  label: string;
  items: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    label: "Platform",
    items: ["Snowflake", "Airflow on K8s", "dbt", "Terraform", "GitOps", "Spark"],
  },
  {
    label: "AI",
    items: ["MCP servers", "LLM tooling", "AI agents", "Self-service bots"],
  },
  {
    label: "Leadership",
    items: ["Hiring & mentoring", "Platform roadmaps", "Docs & standards", "Data governance"],
  },
];
