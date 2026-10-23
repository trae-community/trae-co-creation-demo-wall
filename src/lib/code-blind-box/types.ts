export type BlindBoxDraw = {
  slot: 1 | 2;
  themeWord: string;
  functionWord: string;
  styleWord: string;
  drawnAt: string;
};

export type BlindBoxSession = {
  options: BlindBoxDraw[];
  chosenSlot: 1 | 2 | null;
  confirmed: boolean;
};
