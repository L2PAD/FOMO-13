export interface IDescriptionModals {
  isScope: boolean;
  isLvlOne: boolean;
  isLvlTwo: boolean;
}

export type DescriptionModalKey = keyof IDescriptionModals;

export const DEFAULT_DESCRIPTION_MODALS: IDescriptionModals = {
  isScope: false,
  isLvlOne: false,
  isLvlTwo: false,
};
