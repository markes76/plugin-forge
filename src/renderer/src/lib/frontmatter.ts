import yaml from 'js-yaml'

export function toYamlFrontmatter(data: Record<string, unknown>): string {
  // Filter out undefined/null/empty values
  const clean = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  )

  if (Object.keys(clean).length === 0) return ''

  const yamlStr = yaml.dump(clean, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true
  })

  return `---\n${yamlStr}---`
}
