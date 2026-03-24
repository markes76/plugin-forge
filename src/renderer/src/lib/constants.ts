export interface ConnectorEntry {
  id: string
  name: string
  url: string
  description: string
  category: string
  builtIn: boolean
}

export const DEFAULT_CONNECTORS: ConnectorEntry[] = [
  { id: 'slack', name: 'Slack', url: 'https://mcp.slack.com/mcp', description: 'Channels, messages, threads', category: 'Chat', builtIn: true },
  { id: 'google-calendar', name: 'Google Calendar', url: 'https://gcal.mcp.claude.com/mcp', description: 'Events, availability, scheduling', category: 'Calendar', builtIn: true },
  { id: 'gmail', name: 'Gmail', url: 'https://gmail.mcp.claude.com/mcp', description: 'Read, search, draft emails', category: 'Email', builtIn: true },
  { id: 'google-drive', name: 'Google Drive', url: 'https://gdrive.mcp.claude.com/mcp', description: 'Docs, Sheets, Slides, files', category: 'Storage', builtIn: true },
  { id: 'notion', name: 'Notion', url: 'https://mcp.notion.com/mcp', description: 'Pages, databases, wikis', category: 'Knowledge Base', builtIn: true },
  { id: 'figma', name: 'Figma', url: 'https://mcp.figma.com/mcp', description: 'Design files, components, tokens', category: 'Design', builtIn: true },
  { id: 'canva', name: 'Canva', url: 'https://mcp.canva.com/mcp', description: 'Design assets, templates', category: 'Design', builtIn: true },
  { id: 'asana', name: 'Asana', url: 'https://mcp.asana.com/v2/mcp', description: 'Tasks, projects, workflows', category: 'Project Management', builtIn: true },
  { id: 'linear', name: 'Linear', url: 'https://mcp.linear.app/mcp', description: 'Issues, projects, cycles', category: 'Project Management', builtIn: true },
  { id: 'atlassian', name: 'Atlassian', url: 'https://mcp.atlassian.com/v1/mcp', description: 'Jira issues, Confluence docs', category: 'Project Management', builtIn: true },
  { id: 'monday', name: 'Monday.com', url: 'https://mcp.monday.com/mcp', description: 'Boards, items, automations', category: 'Project Management', builtIn: true },
  { id: 'clickup', name: 'ClickUp', url: 'https://mcp.clickup.com/mcp', description: 'Tasks, docs, goals', category: 'Project Management', builtIn: true },
  { id: 'hubspot', name: 'HubSpot', url: 'https://mcp.hubspot.com/anthropic', description: 'Contacts, deals, campaigns', category: 'CRM', builtIn: true },
  { id: 'salesforce', name: 'Salesforce', url: 'https://mcp.salesforce.com/mcp', description: 'Accounts, opportunities, records', category: 'CRM', builtIn: true },
  { id: 'amplitude', name: 'Amplitude', url: 'https://mcp.amplitude.com/mcp', description: 'Product analytics, events', category: 'Analytics', builtIn: true },
  { id: 'intercom', name: 'Intercom', url: 'https://mcp.intercom.com/mcp', description: 'Conversations, users, support', category: 'Support', builtIn: true },
  { id: 'tavily', name: 'Tavily', url: 'https://mcp.tavily.com/mcp', description: 'Web search and research', category: 'Search', builtIn: true },
  { id: 'fireflies', name: 'Fireflies', url: 'https://mcp.fireflies.ai/mcp', description: 'Meeting transcripts, notes', category: 'Meetings', builtIn: true },
  { id: 'outreach', name: 'Outreach', url: 'https://api.outreach.io/mcp', description: 'Sales engagement, sequences', category: 'Sales', builtIn: true },
  { id: 'microsoft-365', name: 'Microsoft 365', url: 'https://mcp.microsoft365.com/mcp', description: 'Outlook, SharePoint, OneDrive, Teams', category: 'Office Suite', builtIn: true }
]
