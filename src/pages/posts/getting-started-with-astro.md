---
layout: ../../layouts/BlogPost.astro
title: "Getting Started with Astro"
description: "Astro is a new static site generator that allows you to use your favorite JavaScript framework while delivering zero JavaScript to the client by default."
pubDate: 2023-04-15
author: "Alex Norum"
image: "/images/blog/astro-logo.png"
tags: ["astro", "web development", "tutorial"]
category: "tutorial"
---

# Getting Started with Astro

Astro is a modern static site generator that offers an innovative approach to building websites. Unlike traditional frameworks that send large JavaScript bundles to the client, Astro generates static HTML by default, resulting in faster page loads and better performance.

## Why Choose Astro?

There are several compelling reasons to consider Astro for your next project:

1. **Performance-first architecture**: Astro websites are designed to be lightning-fast by default.
2. **Use your favorite framework**: You can use React, Vue, Svelte, or other frameworks within Astro.
3. **Island Architecture**: Load JavaScript only for the interactive components that need it.
4. **Powerful features**: Built-in markdown support, file-based routing, and more.

## Setting Up Your First Astro Project

Getting started with Astro is straightforward. Here's how to create your first project:

```bash
# Create a new project with npm
npm create astro@latest

# Or with yarn
yarn create astro

# Or with pnpm
pnpm create astro
```

Follow the prompts to set up your project. Once installed, you can start the development server:

```bash
npm run dev
```

## Project Structure

A typical Astro project has the following structure:

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

- **public/**: Static assets that will be copied to the build folder
- **src/components/**: Reusable UI components
- **src/layouts/**: Page layouts
- **src/pages/**: File-based routing

## Creating Your First Component

Astro components use a `.astro` extension and have a syntax similar to HTML with frontmatter:

```astro
---
// Component Script (JavaScript)
const greeting = "Hello, Astro!";
---

<!-- Component Template (HTML + JS Expressions) -->
<h1>{greeting}</h1>
<p>This is my first Astro component!</p>

<style>
  /* Component Styles (Scoped by default) */
  h1 {
    color: purple;
    font-size: 2rem;
  }
</style>
```

## Conclusion

Astro offers a refreshing approach to building websites, focusing on performance while still allowing developers to use their favorite tools and frameworks. Its island architecture ensures that you only send JavaScript when necessary, resulting in faster, more efficient websites.

Give Astro a try for your next project, and experience the benefits of this modern web framework!
