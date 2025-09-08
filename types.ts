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

export interface MakeupRecommendation {
    product: string;
    technique: string;
}

export interface MakeupTips {
    face: MakeupRecommendation[];
    eyes: MakeupRecommendation[];
    lips: MakeupRecommendation[];
    generalTip: string;
}

export interface FashionItem {
    item: string;
    reason: string;
}

export interface FashionTips {
    clothingItems: FashionItem[];
    fabricsAndTextures: FashionItem[];
    accessories: FashionItem[];
    styleInspiration: string;
}

export interface HairStylingTip {
    style: string;
    description: string;
    products: string[];
}

export interface PersonalColorAnalysis {
  season: string;
  description:string;
  palette: ColorInfo[];
  colorsToAvoid: ColorInfo[];
  koreanCelebrity: KoreanCelebrity;
  makeupTips: MakeupTips;
  fashionTips: FashionTips;
  hairColorRecommendations: string[];
  hairStylingTips: HairStylingTip[];
}