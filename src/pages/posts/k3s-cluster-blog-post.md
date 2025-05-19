---
layout: ../../layouts/BlogPost.astro
title: "My Raspberry Pi Kubernetes Cluster with k3s"
description: "How I run a small self-hosted Kubernetes cluster at home using Raspberry Pis and k3s."
pubDate: 2023-05-14
author: "Alex Norum"
image: "/images/blog/k3s-cluster.JPG"
tags: ["kubernetes", "k3s", "raspberry pi", "homelab", "self-hosting"]
category: "homelab"
---

# My Raspberry Pi Kubernetes Cluster with k3s

At some point, I got tired of juggling a bunch of $10-a-month services just to run side projects, a media server, or my personal site. I’ve worked with Kubernetes a lot on the software and ops side, but never really got hands-on with the hardware. So I figured, why not build a small cluster myself?

This is what I ended up with: a lightweight, low-power Kubernetes cluster made from Raspberry Pis running [k3s](https://k3s.io). It handles everything from internal tools to hobby projects—and it’s fun to maintain.

## Why I Built It

The motivation was pretty simple:

- I wanted more control over the stuff I run.
- I didn’t want to keep paying for cloud VMs for every small project.
- I was curious about managing the hardware layer of Kubernetes.

I wasn’t aiming to replicate a production setup—just something reliable, self-contained, and educational.

## The Hardware

The cluster is made up of three Raspberry Pi 4s:

- One acts as the control plane node.
- Two serve as workers.
- Everything’s wired through a gigabit switch.

The control node is connected to a 512GB SSD (for fast workloads) and a 12TB HDD (for media). This split lets me separate performance-sensitive stuff like databases from bulk storage.

## Software Stack

Here’s what powers the cluster:

- **k3s**: A slimmed-down Kubernetes distribution. It’s easy to install and works well on ARM.
- **MetalLB**: Provides local IPs for services.
- **Nginx Ingress**: Routes traffic internally.
- **Cloudflare Tunnel**: Handles external traffic without opening up my home network.
- **Argo CD**: Keeps everything in sync with a Git repo.
- **Sealed Secrets**: Lets me store secrets safely in Git.

The whole setup is automated using Ansible, so if something goes sideways, I can rebuild the cluster without much hassle.

## Storage Setup

Storage is split across two drives:

- The SSD runs databases and apps that need faster I/O.
- The HDD stores large media files and backups.

I use local persistent volumes and define custom StorageClasses in Kubernetes to make sure workloads end up on the right disk.

## What It Hosts

I run a mix of self-hosted tools, including:

- **Media**: Jellyfin, Sonarr, Kavita, Audiobookshelf
- **Home Automation**: Home Assistant, AdGuard
- **Utilities**: Mealie (recipes), Uptime Kuma (monitoring), Homepage (dashboard)
- **Auth**: Authentik for SSO
- **Projects**: My own APIs and bots (like Marabot), plus a lightweight AI model server (Ollama). Which to be honest works horribly on Pis :sweat_smile:, but was fun none the less.

All services run in the cluster and are accessible either locally or through secure tunnels. The setup is stable and keeps everything I care about under my control.

## Networking

- **Internal access** uses MetalLB and local DNS.
- **External access** goes through Cloudflare Tunnel, routing subdomains to the right service via Nginx Ingress.
- **Authentication** is handled with Authentik for apps that support it.

## Final Thoughts

This project gave me a chance to explore Kubernetes from a different angle—beyond YAML and cloud consoles. It’s been useful, affordable, and fun to maintain.

If you’ve got a few Raspberry Pis lying around and a bit of curiosity, k3s is a great way to learn more about how modern infrastructure fits together.
