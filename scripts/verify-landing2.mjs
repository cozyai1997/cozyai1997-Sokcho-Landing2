import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "package.json",
  "index.html",
  "src/App.tsx",
  "src/styles.css",
  "api/leads.ts",
  "api/_sms.ts",
  "vite.config.ts",
  "README.md",
  "docs/supabase-landing2-setup.sql",
];

function read(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }

  return readFileSync(path, "utf-8");
}

function expectIncludes(path, contents, expected) {
  if (!contents.includes(expected)) {
    throw new Error(`${path} must include ${JSON.stringify(expected)}`);
  }
}

for (const path of requiredFiles) {
  read(path);
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.name !== "sokcho-landing2-resort-magazine") {
  throw new Error("package.json name must be sokcho-landing2-resort-magazine");
}

expectIncludes("index.html", read("index.html"), "Sokcho-Landing2");
expectIncludes("src/App.tsx", read("src/App.tsx"), "landing2-resort-magazine");
expectIncludes("src/App.tsx", read("src/App.tsx"), "lux-hero");
expectIncludes("src/App.tsx", read("src/App.tsx"), "lux-premium-band");
expectIncludes("src/styles.css", read("src/styles.css"), ".lux-hero");
expectIncludes("src/styles.css", read("src/styles.css"), ".lux-premium-band");
expectIncludes("api/leads.ts", read("api/leads.ts"), 'const tableName = "sokcho_landing2_leads"');
expectIncludes("api/leads.ts", read("api/leads.ts"), 'source: "landing2-resort-magazine"');
expectIncludes("api/_sms.ts", read("api/_sms.ts"), 'sokcho_landing2_sms_settings');
expectIncludes("vite.config.ts", read("vite.config.ts"), 'source: "landing2-resort-magazine"');
expectIncludes("vite.config.ts", read("vite.config.ts"), "sokcho-landing2-leads");
expectIncludes("README.md", read("README.md"), "sokcho_landing2_leads");
expectIncludes("README.md", read("README.md"), "SUPABASE_ADMIN_TOKEN");
expectIncludes("docs/supabase-landing2-setup.sql", read("docs/supabase-landing2-setup.sql"), "create table if not exists public.sokcho_landing2_leads");
expectIncludes("docs/supabase-landing2-setup.sql", read("docs/supabase-landing2-setup.sql"), "alter table public.sokcho_landing2_leads enable row level security");

console.log("Landing2 verification passed.");
