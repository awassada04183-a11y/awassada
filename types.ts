
export interface Option {
  text: string;
  score: number;
}

export interface Question {
  trait: string;
  text: string;
  options: Option[];
}
