export const stackHeadline: string[] = [
  "Snowflake",
  "Airflow",
  "dbt",
  "Kafka",
  "Terraform",
  "Kubernetes",
  "AI Agents & MCP",
];

export interface SkillCategory {
  label: string;
  items: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    label: "Core",
    items: ["Python", "SQL", "Airflow", "Snowflake", "dbt", "Spark", "Kafka", "Flink", "Kubernetes", "Terraform", "AWS"],
  },
  {
    label: "Also",
    items: ["Delta Lake", "Postgres", "Docker", "GitHub Actions", "GitOps"],
  },
  {
    label: "AI",
    items: ["LLM tooling", "MCP servers", "Agents", "Slack bots", "Claude Code and Cursor every day"],
  },
  {
    label: "Honest levels",
    items: ["TypeScript and React: can build things, not expert"],
  },
];
