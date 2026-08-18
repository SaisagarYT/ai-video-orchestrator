export interface CommandAction {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Campaigns' | 'System';
  shortcut?: string;
  keywords?: string[];
  icon?: string;
  perform: () => void;
}
