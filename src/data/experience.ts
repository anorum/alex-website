import legalZoomLogo from '../assets/logos/LegalZoomlogo.webp';
import newRelicLogo from '../assets/logos/newreliclogo.svg';
import oracleLogo from '../assets/logos/oraclelogo.png';

export interface ExperienceItem {
  company: string;
  logo: ImageMetadata;
  role: string;
  period: string;
  year: string;
  description: string;
  achievements: string[];
  isPromotion: boolean;
  isCurrent?: boolean;
}

export const experience: ExperienceItem[] = [
  {
    company: "LegalZoom",
    logo: legalZoomLogo,
    role: "Group Manager, Data Engineering",
    period: "2023 - Present",
    year: "2023",
    description: "Leading a small team that owns LegalZoom's data platform - Snowflake, Airflow on Kubernetes, dbt, Terraform, and the self-service tooling around all of it.",
    achievements: [
      "Designed domain-based Snowflake access model that automates role assignments",
      "Built AI-powered support bot and MCP server for the data platform",
      "Led DSR automation and dynamic PII column masking for governance",
    ],
    isPromotion: true,
    isCurrent: true,
  },
  {
    company: "LegalZoom",
    logo: legalZoomLogo,
    role: "Principal Data Engineer",
    period: "2021 - 2023",
    year: "2021",
    description: "Rebuilt LegalZoom's data platform from legacy to modern - Airflow on Kubernetes, Terraform-managed Snowflake, and GitOps workflows for everything.",
    achievements: [
      "Migrated the platform to Airflow on K8s with Terraform IaC",
      "Wrote the platform standards and documentation the team still uses",
      "Established self-service patterns that let domain teams own their own data",
    ],
    isPromotion: false,
  },
  {
    company: "New Relic",
    logo: newRelicLogo,
    role: "Senior Data Engineer → Lead Data Analyst",
    period: "2018 - 2021",
    year: "2018",
    description: "Owned the data engineering platform roadmap. Built blue/green deployments, testing frameworks, and brought dbt to the org.",
    achievements: [
      "Introduced dbt - first adoption across the data org",
      "Built Spark pipelines ingesting from 10+ data sources",
      "Created self-service tooling for analyst teams",
    ],
    isPromotion: false,
  },
  {
    company: "Oracle",
    logo: oracleLogo,
    role: "Senior Business Analyst",
    period: "2013 - 2018",
    year: "2013",
    description: "Worked across R&D, manufacturing, and supply chain building analytics and migrating Oracle's worldwide SCM systems to cloud.",
    achievements: [
      "Cut forecasting pipeline runtime from 4 hours to 20 minutes",
      "Built predictive models for manufacturing capacity planning",
      "Led on-prem to cloud migration for worldwide SCM",
    ],
    isPromotion: false,
  },
];
