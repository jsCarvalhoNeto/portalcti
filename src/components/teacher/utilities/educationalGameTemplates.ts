import { MAZE_GAME_DESCRIPTION, MAZE_GAME_TEMPLATE, MAZE_GAME_TITLE } from './educationalMazeGameTemplate';
import type { EducationalGameAccessMode, EducationalGameCapability } from '@/services/educationalGameService';

export interface EducationalGameTemplate {
  key: string;
  version: number;
  title: string;
  description: string;
  accessMode: EducationalGameAccessMode;
  capabilities: EducationalGameCapability[];
  code: string;
}

export const EDUCATIONAL_GAME_TEMPLATES: EducationalGameTemplate[] = [
  {
    key: 'maze-college',
    version: 1,
    title: MAZE_GAME_TITLE,
    description: MAZE_GAME_DESCRIPTION,
    accessMode: 'online',
    capabilities: ['multiplayer', 'keyboard', 'touch', 'realtime'],
    code: MAZE_GAME_TEMPLATE
  }
];

export const getEducationalGameTemplate = (key: string) =>
  EDUCATIONAL_GAME_TEMPLATES.find(template => template.key === key);
