export enum AppStep {
  Welcome,
  GenderSelection,
  Capture,
  Analyzing,
  Result,
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export interface ColorInfo {
  name: string;
  hex: string;
}

export interface KoreanCelebrity {
  name: string;
  description: string;
  celebrityImageURL: string;
}

export type KBeautyStyle = 'Natural Glow' | 'Bold & Chic' | 'Vintage K-drama' | 'Celebrity Inspired';

export type ShotType = 'Bust' | 'Waist' | 'Full';

export interface PersonalColorAnalysis {
  season: string;
  description:string;
  palette: ColorInfo[];
  colorsToAvoid: ColorInfo[];
  koreanCelebrity: KoreanCelebrity;
  makeupTips: string;
  fashionTips: string;
  hairColorRecommendations: string[];
}