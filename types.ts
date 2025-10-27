
export enum MarketingMedium {
  Mug = 'Mug',
  Billboard = 'Billboard',
  TShirt = 'T-Shirt',
}

export type MediumInfo = {
  id: MarketingMedium;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
};
