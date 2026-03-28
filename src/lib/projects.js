// Load project metadata from projects/*/meta.json

export async function getProjects() {
  const metaFiles = import.meta.glob('/projects/*/meta.json', { eager: true });
  const projects = Object.values(metaFiles)
    .map((mod) => mod.default || mod)
    .filter((p) => p.status !== 'template')
    .sort((a, b) => b.day - a.day);
  return projects;
}

export async function getAllProjects() {
  const metaFiles = import.meta.glob('/projects/*/meta.json', { eager: true });
  const projects = Object.values(metaFiles)
    .map((mod) => mod.default || mod)
    .sort((a, b) => b.day - a.day);
  return projects;
}

export async function getProjectCount() {
  const projects = await getProjects();
  return projects.length;
}
