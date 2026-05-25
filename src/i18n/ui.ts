// App-chrome strings (not system-specific). Keyed by language; resolved via tr().
import type { Lang } from './lang';

export const UI: Partial<Record<Lang, Record<string, string>>> = {
  ru: {
    appTitle: 'Лист персонажа',
    myCharacters: 'Мои персонажи',
    newCharacter: 'Новый персонаж',
    createCharacter: 'Создать персонажа',
    noCharacters: 'Пока нет персонажей',
    open: 'Открыть',
    print: 'Экспорт PDF',
    delete: 'Удалить',
    duplicate: 'Дублировать',
    back: 'Назад',
    system: 'Система',
    language: 'Язык',
    lastVisit: 'Был(а)',
    valid: 'Валиден',
    invalid: 'Не готов',
  },
  en: {
    appTitle: 'Character Sheet',
    myCharacters: 'My characters',
    newCharacter: 'New character',
    createCharacter: 'Create character',
    noCharacters: 'No characters yet',
    open: 'Open',
    print: 'Export PDF',
    delete: 'Delete',
    duplicate: 'Duplicate',
    back: 'Back',
    system: 'System',
    language: 'Language',
    lastVisit: 'Last visit',
    valid: 'Valid',
    invalid: 'Incomplete',
  },
};
