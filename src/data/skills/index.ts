import { attackBoost } from './AttackBoost';
import { adrenalineRush } from './AdrenalineRush';
import { chainCrit } from './ChainCrit';
import { challenger } from './Challenger';
import { counterstrike } from './Counterstrike';
import { criticalBoost } from './CriticalBoost';
import { elementalAbsorption } from './ElementalAbsorption';
import { latentPower } from './LatentPower';
import { masterfulStrike } from './MasterfulStrike';
import { maximumMight } from './MaximumMight';
import { mindEye } from './MindEye';
import { peakPerformance } from './PeakPerformance';
import { weaknessExploit } from './WeaknessExploit';
import { zenState } from './ZenState';

export const skillsByCategory = {
  attack: [attackBoost, criticalBoost, mindEye],
  defense: [adrenalineRush, challenger, counterstrike, maximumMight, peakPerformance, latentPower, masterfulStrike, weaknessExploit, chainCrit, elementalAbsorption],
  special: [zenState],
};
