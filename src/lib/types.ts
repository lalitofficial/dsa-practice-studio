export interface Sheet {
  id: string;
  label: string;
  order: number;
  total: number;
  done: number;
}

export interface Problem {
  id: string;
  sheetId: string;
  unit: string;
  chapter: string;
  title: string;
  leetcodeUrl: string;
  youtubeUrl: string;
  resourceUrl: string;
  difficulty: string;
  order: number;
  done: boolean;
  starred: boolean;
  note: string;
}

export interface RevisionItem {
  id: string;
  sheetId: string;
  unit: string;
  chapter: string;
  title: string;
  leetcodeUrl: string;
  difficulty: string;
  done: boolean;
  starred: boolean;
  note: string;
}

export type ProgressPatch = {
  done?: boolean;
  starred?: boolean;
  note?: string;
};

export type Language = "python" | "cpp" | "java" | "javascript";
