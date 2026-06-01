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
  statement?: string;
}

export interface SearchProblem {
  id: string;
  sheetId: string;
  sheetLabel: string;
  unit: string;
  chapter: string;
  title: string;
  difficulty: string;
  done: boolean;
  starred: boolean;
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

export interface LeetCodeStatement {
  title: string;
  difficulty: string;
  content: string;
  tags: string[];
  premium: boolean;
}
