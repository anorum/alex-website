---
layout: ../../layouts/BlogPost.astro
title: "Building My Home Kubernetes Cluster with Raspberry Pi and k3s"
description: "How I built a powerful, energy-efficient home server platform using Raspberry Pi hardware and k3s Kubernetes."
pubDate: 2023-05-14
author: "Alex Norum"
image: "/images/blog/k3s-cluster.png"
tags: ["kubernetes", "k3s", "raspberry pi", "homelab", "self-hosting"]
category: "tutorial"
---

# Building My Home Kubernetes Cluster with Raspberry Pi and k3s

As a tech enthusiast, I've always been fascinated by the idea of running my own home server. After experimenting with various solutions, I decided to build a proper Kubernetes cluster using Raspberry Pi hardware and k3s. In this post, I'll walk through my setup, how it works, and what I use it for.

## Hardware Setup

My cluster consists of:

- **Master Node**: Raspberry Pi 4 with:
  - 512GB SSD (for application workloads)
  - 12TB HDD (for media storage)
- **Worker Nodes**: 2x Raspberry Pi 4
- **Network**: Wired gigabit via switch

This hardware configuration gives me enough power to run all my home services while keeping power consumption and noise to a minimum. The master node handles the control plane and also serves as the primary storage node with the attached drives.

## Cluster Installation

Setting up the cluster was streamlined using Ansible for automation. The process involved:

1. **Preparing the Raspberry Pis**:
   - Configuring cgroups for Kubernetes
   - Enabling PCIe for the external storage on the master node
   - Setting up the necessary boot parameters

2. **Installing k3s**:
   - On the master node: `k3s server` with Traefik and ServiceLB disabled (replaced with Nginx Ingress and MetalLB)
   - On worker nodes: `k3s agent` connecting to the master

3. **Configuring External Storage**:
   - Mounting the 512GB SSD at `/mnt/ssd` for application data
   - Mounting the 12TB HDD at `/mnt/hd` for media storage

The entire setup is automated with Ansible playbooks, making it reproducible and easy to maintain:

```bash
# Initial k3s setup
ansible-playbook -i inventory/hosts.yaml playbook/install-k3s.yaml

# Cloudflared deployment for secure remote access
ansible-playbook -i inventory/hosts.yaml playbook/deploy-cloudflared.yaml
```

## Core Infrastructure

The cluster is built on several key components:

### Kubernetes Base
- **k3s**: A lightweight Kubernetes distribution perfect for Raspberry Pi
- **Argo CD**: Implementing GitOps for declarative configuration management
- **Sealed Secrets**: Securely storing sensitive information in Git

### Networking
- **MetalLB**: Providing load balancing on bare metal (IP range: 192.168.1.150-180)
- **Nginx Ingress**: Handling HTTP routing and SSL termination
- **Cloudflared**: Creating secure tunnels to access services remotely without opening ports

### Storage
- **Local Path Provisioner**: For standard application storage
- **Custom StorageClasses**: For the SSD (2TB) and HDD (12TB) with local persistent volumes

## Applications and Use Cases

My cluster runs a variety of services that I use daily:

### Media Management
- **Jellyfin**: Open-source media server for movies, TV shows, and music
- **Sonarr/Radarr/Readarr**: Automated media collection for TV, movies, and books
- **Prowlarr**: Indexer management
- **Qbittorrent**: Download management
- **Kavita**: E-book and comic management
- **Audiobookshelf**: Audiobook server

### Home Automation
- **Home Assistant**: Controlling smart home devices and automation
- **AdGuard**: Network-wide ad blocking and DNS filtering

### Productivity
- **Mealie**: Recipe management and meal planning
- **Uptime Kuma**: Monitoring service availability
- **Homepage**: Dashboard for all services
- **Authentik**: Single sign-on and identity management

### Custom Applications
- **Alex-API**: My personal API service
- **Marabot**: Custom bot application
- **Ollama**: Self-hosted AI model server

## Network Architecture

The network is designed with security in mind:

1. **Internal Access**: Services are available on my home network via MetalLB IPs or local DNS names
2. **External Access**: Cloudflare Tunnel provides secure remote access without exposing ports to the internet
3. **Authentication**: Authentik provides SSO across services that support it

The Cloudflare Tunnel configuration routes all `*.alexnorum.com` subdomains to the Nginx Ingress controller, which then routes to the appropriate service based on the hostname.

## Storage Strategy

Storage is organized based on performance and capacity needs:

- **SSD Storage (512GB)**: Used for databases, configuration files, and applications that benefit from faster I/O
- **HDD Storage (12TB)**: Used primarily for media files, backups, and other large datasets

This is implemented in Kubernetes using local persistent volumes with specific storage classes:

- `local-ssd-storage`: For performance-sensitive workloads
- `local-hdd-storage`: For capacity-oriented storage needs

## Maintenance and Management

The entire cluster configuration is stored in Git and deployed using Argo CD, following GitOps principles. This means:

1. All changes are made to the Git repository
2. Argo CD automatically synchronizes the cluster state with the repository
3. Version control provides history and rollback capabilities

Monitoring is handled through Prometheus for metrics and Uptime Kuma for service availability checks.

## Conclusion

Building this Raspberry Pi k3s cluster has been an incredibly rewarding project. It provides me with a powerful, energy-efficient home server platform that runs all the services I need while giving me the flexibility to experiment with new applications.

The combination of Kubernetes, GitOps, and automation tools makes management surprisingly straightforward, even as the number of services grows. And with the Cloudflare Tunnel setup, I can securely access everything from anywhere without compromising on security.

If you're considering building your own home lab, I highly recommend the Raspberry Pi + k3s approach. It's cost-effective, power-efficient, and provides a great platform for learning modern infrastructure practices while serving practical needs at home.
