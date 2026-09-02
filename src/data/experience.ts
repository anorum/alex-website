export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  description: string;
  achievements: string[];
  /** expanded by default in the accordion */
  defaultOpen?: boolean;
}

export const experience: ExperienceItem[] = [
  {
    company: "LegalZoom",
    role: "Head of Data Platform",
    period: "2023 - 2026",
    description: "Led the small team that owned LegalZoom's data platform - Snowflake, Airflow on Kubernetes, dbt, Terraform, and the self-service tooling around all of it.",
    achievements: [
      "Automated data access so teams got what they needed without tickets",
      "Built AI tooling that answered platform support questions for the team",
      "Automated the governance and privacy reviews",
    ],
    defaultOpen: true,
  },
  {
    company: "LegalZoom",
    role: "Principal Data Engineer",
    period: "2021 - 2023",
    description: "Rebuilt LegalZoom's platform from a legacy stack to Kubernetes-native - Airflow, Terraform-managed Snowflake, and GitOps for everything.",
    achievements: [
      "Moved the platform to Kubernetes with everything managed as code",
      "Wrote the platform standards and documentation the team still uses",
      "Established self-service patterns so domain teams own their own data",
    ],
  },
  {
    company: "New Relic",
    role: "Lead Data Analyst → Software Engineer, Data Platform",
    period: "2018 - 2021",
    description: "Started as a data analyst and moved to the data platform team. Owned the platform roadmap, built blue/green deployments and testing frameworks, and brought dbt to the org.",
    achievements: [
      "Introduced dbt - first adoption across the data org",
      "Built Spark pipelines ingesting 10+ sources into Delta Lake",
      "Clickstream sessionization and self-service tooling for analyst teams",
    ],
  },
  {
    company: "Oracle",
    role: "Senior Business Analyst",
    period: "2013 - 2018",
    description: "Worked across R&D, manufacturing, and supply chain building analytics and migrating Oracle's worldwide SCM systems to cloud.",
    achievements: [
      "Cut forecasting pipeline runtime from 4 hours to 20 minutes",
      "Built predictive models for manufacturing capacity planning",
      "Led on-prem to cloud migration for worldwide SCM",
    ],
  },
];
