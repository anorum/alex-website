---
title: Alexander Norum - Data Platform Engineering Expertise
summary: "This document will focus on capturing the tools, high-level tasks, and project areas, while removing specific names and role names to maintain anonymity that Alex has worked on"
date_generated: 2025-04-21
---

** Work Experience **
LegalZoom – Group Manager, Data Platform Engineering

Dec 2022 – Present
	•	Lead roadmap, architecture, and delivery for LegalZoom’s modern data platform
	•	Manage team focused on Snowflake, Airflow on Kubernetes, dbt, Vault, and self-service tooling
	•	Drove governance initiatives including DSR automation and Snowflake access model design

⸻

LegalZoom – Principal Data Engineer, Data Platform

Dec 2021 – Dec 2022
	•	Rebuilt the data platform from the ground up as a solo engineer
	•	Introduced Airflow on Kubernetes and Terraform-managed Snowflake/Postgres
	•	Defined GitOps workflows and led hiring to grow the platform team

⸻

New Relic – Senior Software Engineer, Data Platform

2019 – Present
	•	Lead roadmap and development of New Relic’s core data engineering platform
	•	Architected key features including blue/green deployments, testing, orchestration, and self-service tooling
	•	Designed and implemented a comprehensive suite of tools for data ingestion, transformation, testing, and monitoring
	•	Built and optimized pipelines supporting analytics and machine learning use cases
	•	Led development of Spark pipelines to ingest data from relational databases, Elasticsearch, and Kafka

⸻

Oracle – Senior Business Analyst

2013 – 2020
	•	Partnered with R&D, manufacturing, supply chain, and marketing to implement enterprise solutions
	•	Executed on-prem to cloud migration for Oracle’s Worldwide SCM Procurement and Inventory systems
	•	Re-engineered global forecasting pipelines, reducing runtime from 4 hours to 20 minutes
	•	Built predictive applications for manufacturing accuracy, streamlining global operations
	•	Collaborated with manufacturing leadership to simulate and optimize headcount and factory utilization

⸻

Scenic Fruit Company – Operations Optimization Analyst

2012 – 2013
	•	Introduced analytics capabilities to a small family farm operation
	•	Built systems to track inventory, fruit quality, shrink, efficiency, and market dynamics
	•	Developed predictive models for storage, shipping, and supplier negotiation, increasing profit margins

**Data Platform Engineering Initiatives**

This document summarizes various data platform engineering initiatives and tasks.

*   **Data Pipeline and Workflow Management:**
    *   Work has been done on **migrating Airflow infrastructure** to a **Kubernetes-based deployment** for improved modularity and maintainability. This involved moving core Airflow components from a monolithic system to a centralized infrastructure.
    *   Efforts include **implementing multiple executor support in Airflow (Celery & Kubernetes)**.
    *   There is evidence of work on **defining and implementing model ownership metadata and monitoring standards for machine learning workflows within Model Hub**. This likely involves establishing processes for **reliability, accountability, and observability**.
    *   Tasks related to **setting up and integrating monitoring** using tools like **Datadog** across various services owned by the data platform engineering team and Model Hub have been undertaken. This includes ensuring services are in the **Datadog Service Catalog** and have basic monitoring and dashboards. A **lightweight monitoring playbook** was planned.
    *   Work involved **creating an Airflow System Design document**.
    *   Initiatives to **implement ObjectStoragePaths for S3** within **Airflow** have been carried out.
    *   A **POC for a VirtualEnv strategy for PythonExternalOperator in Airflow** was explored. This aimed to embed virtual environments within Dockerfiles for Python-based Airflow tasks.
    *   Work was done on **setting up the Airflow API for DAGs metadata table**.
    *   Efforts included **creating Template Folder DAGs**.
    *   Tasks related to **updating Airflow to use a new database and role** in different environments were completed.
    *   Work on **completing Cronitor setup and integration** was undertaken for monitoring purposes.
    *   A task focused on **adding monitoring and alerting for a data-related tool** was completed.
    *   There was involvement in **pairing with another engineer to finalize the deployment of a python script**.
    *   Work on a **Snowflake Partner Share Snowpipe** was completed.
    *   Tasks related to **migrating datasets to a platform domain** were undertaken.
    *   A **POC for Cosmos DBT Dags using Kubernetes Pod Operators** was performed.
    *   There was a task to **implement ObjectStoragePaths for S3**.

*   **Cloud Infrastructure and Security:**
    *   Work has been done to **add Create STAGE to writer domain roles**.
    *   Efforts include **creating github-oidc integration in Vault** for a new github cloud instance. This enables secure secret retrieval within GitHub workflows.
    *   Tasks involved **setting up a VPN** for a user to support a deployment.
    *   A **Kubernetes Secret Engine** was set up for a data engineering cluster.
    *   Work was done on **provisioning access** to various AWS and Kubernetes resources for a user to support a data deletion system deployment. This included **AWS account permissions, Kubernetes namespace access, ArgoCD visibility, and access to the deployment repository**.
    *   Efforts focused on **creating AWS resources for Model Hub**.
    *   Tasks related to **moving an IAM role to a domain-admin repository and bundling it with Storage Integration** were completed.
    *   Work involved **setting up infrastructure for a Proof of Concept (PoC)**, potentially involving AWS accounts and Kubernetes clusters.
    *   A task to **create an OIDC role for GitHub Actions deployment for Model Hub** was completed.
    *   Work was done on **setting up Vault for a tool** to facilitate direct interaction with APIs and other resources.
    *   Tasks included **killing internal groups in Vault**.

*   **Data Modeling and Transformation (dbt):**
    *   An initiative to **migrate a dbt project to a domain architecture and modern development workflow** is in progress. This involves aligning with domain-based architecture and addressing complexities related to multiple databases and development clones.
    *   Work has been done on **privacy tagging within dbt**.
    *   Tasks related to **self-service grants in dbt** were completed.
    *   Efforts included **moving dbt models to a domain-specific Airflow dbt setup**.
    *   A task to **refine a macro in a dbt project for data masking** is in progress.
    *   Work on **granting integration access to a local dbt development role** was completed.

*   **Data Governance and Security:**
    *   An **Openmetadata PoC** was initiated. A **Snowflake service user** was created for this.
    *   Efforts are underway to **define a clear and scalable role hierarchy and access granting strategy** for the data platform. This aims to leverage existing group structures for permission management and improve auditability.
    *   Work has been done to **integrate Azure AD data into Snowflake**.
    *   Initiatives to **implement an automated data masking strategy in Snowflake** leveraging data classification and column-level masking policies are in progress. This included creating an **Airflow DAG to automate classification profiles on new schemas**.
    *   Tasks related to **deprecating legacy Snowflake Terraform configurations** and cleaning up associated objects are ongoing. This includes:
        *   **Deprecating/Migrating storage integrations**.
        *   **Deprecating/Migrating stages**.
        *   **Deprecating/Migrating Snowflake shares**.
        *   **Killing masking policies**.
        *   **Destroying account-level database roles**.
        *   **Migrating production databases**.
    *   Work was done on **turning off Snowflake Provisioning for CREATE Groups and managing only access**.
    *   Tasks involved **documenting the process for managing shares and S3 ingestion**.
    *   Efforts related to **defining a role hierarchy and access granting strategy** have been initiated.
    *   A task to **grant a user access to sensitive data roles** was completed.
    *   Work on **granting specific database access to users** was undertaken.
    *   Tasks related to **setting up Snowflake integrations to connect to S3** were addressed.
    *   Efforts involved **adding a Snowflake Share**.
    *   A task to **create a database for a team to use for data ingestion using Snowflake share** was selected for development.
    *   Work was done to **add metadata to a dataset**.
    *   Tasks related to **granting access to Thoughtspot connections** were completed.
    *   A task to **grant integration access** was completed.
    *   Efforts included **creating Medium and Large warehouses for a business purpose**.
    *   Work on **creating Terraform Module patterns for Snowflake Account Roles** was completed.
    *   Tasks related to **granting a user access to a specific database role** were completed.

*   **Data Ingestion and Integration (Fivetran, Kafka, S3):**
    *   Work involved **supporting a partner in onboarding** to the data ingestion and reporting platform, primarily enabling **ingestion of SQL Server data into Snowflake using Fivetran**. This included **setting up the SQL Server Agent and Fivetran Connector**.
    *   A task to send a **list of Fivetran connectors to a data governance channel** was completed.
    *   Efforts focused on **defining ownership for Fivetran connectors**. This included ensuring each connector has a programmatically captured owner.
    *   A **playbook on Fivetran best practices, ownership roles, and setup** was created.
    *   Work was done to **document the Kafka ingestion process**.
    *   Tasks involved **setting up Snowflake integrations to connect to S3**.
    *   A task related to a **Snowflake Partner Share Snowpipe** was completed.
    *   Efforts included **automating the archival of cold, expensive Snowflake tables to S3 Glacier**.

*   **Model Deployment and Management (Model Hub):**
    *   Work was done on **adding Create STAGE to writer domain roles**, potentially for Model Hub.
    *   Efforts included **defining and implementing model ownership metadata and monitoring standards for machine learning workflows within Model Hub**.
    *   A **Backstage software template** was created to **standardize the structure and deployment of LLM-based applications**, supporting both Bedrock-based models and custom app code flows. The template included pre-wired integrations for logging, monitoring, and observability.
    *   Tasks related to **creating AWS resources for Model Hub** were completed.
    *   Work involved **creating an OIDC role for the GitHub Actions deployment for Model Hub**.
    *   Efforts are underway to **support the deployment of Model Servers**.
    *   A task to **implement cost monitoring for Model Hub** was undertaken.
    *   Work on **decommissioning old ingress endpoints for Model Hub** was completed.
    *   Tasks related to **setting up public ingress for SAAS tools (like Hex, Snowflake) for Model Hub** were addressed.
    *   Efforts to **create a domain for Model Hub access** were initiated.

*   **Data Deletion and Privacy (Teleskope):**
    *   Work on a data deletion system (**Teleskope**) is ongoing. This includes:
        *   **Provisioning access for a user** to support and troubleshoot the deployment.
        *   **Setting up infrastructure** for the PoC.
        *   **Validating status management on deletion requests**.
        *   Engaging with stakeholders on integration aspects.
        *   Addressing scenarios for replaying deletion requests.
        *   Noting the unavailability of RBAC in the PoC.
        *   Evaluating notifications and failures workflow and setup.
        *   Setting up a dummy database instance for testing.
        *   Conducting a security review.
        *   Focusing on RBAC and Role Definitions.
        *   Defining a centralized platform for instrumenting data deletion.
        *   Investigating OneTrust integration.
        *   Integrating with Segment in production.
        *   Documenting the audit workflow for data deletion.

*   **Data Contracts and Quality:**
    *   Initiatives related to **implementing Data Contracts** are in progress. This includes:
        *   Developing an **Airflow Operator** to run data contracts.
        *   Creating a **workflow to run tests on a contract and publish results**.
        *   Implementing a **Data Contract locally**.
        *   Expanding data contracts to **publish to Datahub**.
        *   Evaluating a **datacontracts-cli tool**.
        *   Discussing where to store data contracts.
        *   Developing a **stateless data contracts CICD Pipeline**.
        *   Creating a **Github Actions Linting Action**.
        *   Establishing a **Data Platform Github Actions Repo**.
        *   Prototyping **Github Action for Data Quality checks based on data contracts**.

*   **Cost Management and Reporting:**
    *   An initiative to **build costing report-outs per data domain** (e.g., product, marketing) is underway. This aims to provide visibility into Snowflake usage, S3 storage, and compute resource costs tied to each domain.
    *   The goal is to enable better cost accountability and identify optimization opportunities.
    *   Work on **implementing cost monitoring for Model Hub** was done.
    *   Tasks related to **migrating ThoughtSpot Costing Datasets to a Platform domain** were completed.

*   **Documentation and Standards:**
    *   Efforts are focused on **updating documentation to reflect new structures and onboarding steps**.
    *   A project to **review and update system design documents and operational runbooks** for various platform systems is in progress. This aims to ensure documentation is current, accurate, standardized, easy to onboard, and maintainable. The scope includes Airflow, Teleskope, and Model Hub documentation.
    *   A task to **document the process for managing shares and S3 ingestion** was initiated.
    *   Work involved creating an **Airflow System Design document**.
    *   A **lightweight monitoring playbook** was planned.
    *   Efforts to **document data ingestion processes** are evident.
    *   A task to **document the audit workflow for data deletion** was undertaken.

*   **Tooling and Automation:**
    *   Work involved **creating a Backstage software template** for LLM app development.
    *   Efforts included **creating github-oidc integration in Vault**.
    *   Tasks related to **setting up Vault for a tool** were completed.
    *   A **POC for Cosmos DBT Dags using Kubernetes Pod Operators** was performed.
    *   Work was done to **create a Terraform Repo to manage alerting rules in DataDog**.
    *   Tasks related to **creating Terraform Module patterns** for various resources (e.g., Snowpipe, Storage Integration, Snowflake Account Role) were completed.
    *   Efforts focused on developing a **stateless data contracts CICD Pipeline** using Github Actions.
    *   A task to **create Data Science CICD** was completed.
    *   Work on **automating the archival of cold Snowflake tables to S3 Glacier** is in progress.
    *   Initiatives to **implement self-service access** capabilities were undertaken.

This document captures a wide range of activities, demonstrating experience in **data pipeline development and management (Airflow, Kubernetes), cloud infrastructure (AWS, Kubernetes, Vault), data modeling and transformation (dbt), data governance and security (Snowflake, Openmetadata, Vault), data ingestion and integration (Fivetran, Kafka, S3), model deployment and management (Model Hub), data deletion and privacy (Teleskope), data contracts and quality assurance, cost management and reporting, documentation, and automation using tools like Terraform and GitHub Actions.** The work spans various stages of project lifecycles, from PoCs and design to implementation, deployment, and maintenance.