// Fix: Add React import to resolve React namespace error.
import React from 'react';

export enum MarketingMedium {
  Mug = 'Mug',
  Billboard = 'Billboard',
  TShirt = 'T-Shirt',
  ToteBag = 'Tote Bag',
  PhoneCase = 'Phone Case',
  SocialMediaPost = 'Social Media Post',
}

export type MediumInfo = {
  id: MarketingMedium;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
};
