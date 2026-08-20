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
  /** expanded by default in the accordion */
  isCurrent?: boolean;
}

export const experience: ExperienceItem[] = [
  {
    company: "LegalZoom",
    logo: legalZoomLogo,
    role: "Head of Data Platform",
    period: "2023 - 2026",
    year: "2023",
    description: "Led the small team that owned LegalZoom's data platform - Snowflake, Airflow on Kubernetes, dbt, Terraform, and the self-service tooling around all of it.",
    achievements: [
      "Automated data access so teams got what they needed without tickets",
      "Built AI tooling that took platform support off the team's plate",
      "Automated the governance and privacy work that used to be manual",
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
    description: "Rebuilt LegalZoom's platform from a legacy stack to Kubernetes-native - Airflow, Terraform-managed Snowflake, and GitOps for everything.",
    achievements: [
      "Moved the platform to Kubernetes with everything managed as code",
      "Wrote the platform standards and documentation the team still uses",
      "Established self-service patterns so domain teams own their own data",
    ],
    isPromotion: false,
  },
  {
    company: "New Relic",
    logo: newRelicLogo,
    role: "Lead Data Analyst → Software Engineer, Data Platform",
    period: "2018 - 2021",
    year: "2018",
    description: "Started as a data analyst and moved to the data platform team. Owned the platform roadmap, built blue/green deployments and testing frameworks, and brought dbt to the org.",
    achievements: [
      "Introduced dbt - first adoption across the data org",
      "Built Spark pipelines ingesting 10+ sources into Delta Lake",
      "Clickstream sessionization and self-service tooling for analyst teams",
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
