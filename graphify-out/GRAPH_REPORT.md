# Graph Report - development  (2026-09-17)

## Corpus Check
- Corpus is ~8,995 words - fits in a single context window. You may not need a graph.

## Summary
- 193 nodes · 268 edges · 14 communities (11 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Converter UI + deps
- Package scripts
- Product + n8n spec
- TS config
- Fonts + split + utils
- Layout + nav
- Dependencies
- Styler engine
- Dev dependencies
- Agent rules
- ESLint config
- API routes
- n8n bridge
- PostCSS config

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `cn()` - 11 edges
3. `lucide-react` - 8 edges
4. `GlassCard()` - 8 edges
5. `react` - 7 edges
6. `downloadBlob()` - 7 edges
7. `BornoLab Font and Document Suite` - 7 edges
8. `SplitPage()` - 6 edges
9. `SectionTitle()` - 6 edges
10. `scripts` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Wordmark Logo` --conceptually_related_to--> `BornoLab Font and Document Suite`  [INFERRED]
  public/next.svg → README.md
- `Globe World Icon` --conceptually_related_to--> `PDF DOCX Translation`  [AMBIGUOUS]
  public/globe.svg → README.md
- `Unicode Bijoy Converter` --semantically_similar_to--> `Unicode Bijoy Engine`  [INFERRED] [semantically similar]
  README.md → docs/plans.md
- `Font Directory` --semantically_similar_to--> `Font Metadata Schema`  [INFERRED] [semantically similar]
  README.md → docs/plans.md
- `Browser Window Icon` --conceptually_related_to--> `Decorator Styler`  [INFERRED]
  public/window.svg → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **n8n Workflows Bundle** — docs_plans_n8n_format_workflow, docs_plans_ocr_workflow, docs_plans_split_workflow [EXTRACTED 0.75]
- **Core Modules Bundle** — readme_unicode_bijoy_converter, readme_font_directory, readme_pdf_splitter [EXTRACTED 0.75]

## Communities (14 total, 3 thin omitted)

### Community 0 - "Converter UI + deps"
Cohesion: 0.13
Nodes (21): docx, framer-motion, lucide-react, react, ConvertPage(), Dir, CARDS, Thumb (+13 more)

### Community 1 - "Package scripts"
Cohesion: 0.08
Nodes (26): name, private, scripts, build, dev, lint, start, version (+18 more)

### Community 2 - "Product + n8n spec"
Cohesion: 0.08
Nodes (24): BN EN Pipeline Separation, BornoLab Product Automation Spec, Vercel plus Docker Deploy Model, Font Metadata Schema, Auto-Formatting Layout Engine, Format DOCX n8n Workflow, BornoLab Naming, Translate DOC OCR Workflow (+16 more)

### Community 3 - "TS config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 4 - "Fonts + split + utils"
Cohesion: 0.17
Nodes (13): jszip, CATS, FontsPage(), TYPES, SplitPage(), downloadBlob(), parseRangePattern(), BanglaFont (+5 more)

### Community 5 - "Layout + nav"
Cohesion: 0.17
Nodes (11): nextConfig, next, ref_next_link, ref_next_navigation, src_app_globals, metadata, LINKS, Navbar() (+3 more)

### Community 6 - "Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, clsx, docx, file-saver, framer-motion, jszip, lucide-react, mammoth (+8 more)

### Community 7 - "Styler engine"
Cohesion: 0.22
Nodes (8): StylerPage(), BOLD_MAP, flipMap, getVariants(), ITALIC_MAP, mapThrough(), MONO_MAP, StyleVariant

### Community 8 - "Dev dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 9 - "Agent rules"
Cohesion: 0.33
Nodes (6): Generate Agent Files Script, Next.js Agent Rules, Next.js Local Docs Reference, Keep Tree Clean Commit Principle, AGENTS.md Reference, Graphify Memory Tool

### Community 10 - "ESLint config"
Cohesion: 0.40
Nodes (4): eslintConfig, ref_eslint_config, ref_eslint_config_next_core_web_vitals, ref_eslint_config_next_typescript

## Ambiguous Edges - Review These
- `PDF DOCX Translation` → `Globe World Icon`  [AMBIGUOUS]
  public/globe.svg · relation: conceptually_related_to

## Knowledge Gaps
- **98 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 117 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `PDF DOCX Translation` and `Globe World Icon`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `Dependencies` to `Package scripts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Converter UI + deps` to `Package scripts`, `Fonts + split + utils`, `Layout + nav`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `react` connect `Converter UI + deps` to `Package scripts`, `Fonts + split + utils`, `Layout + nav`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Converter UI + deps` be split into smaller, more focused modules?**
  _Cohesion score 0.12878787878787878 - nodes in this community are weakly interconnected._
- **Should `Package scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._