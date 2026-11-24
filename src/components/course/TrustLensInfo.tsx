import React from 'react';
import type { TrustLensEvaluation } from '../../types/course';
import { explainTrust } from '../../utils/scoreExplanations';
import { ScoreInfo } from '../ScoreInfo';

interface TrustLensInfoProps {
  evaluation?: TrustLensEvaluation;
  align?: 'left' | 'right';
}

/**
 * Review-card entry point for the Trust Lens explanation. The popover is the same
 * `ScoreInfo` used by every other score, fed by `explainTrust` so the points on
 * screen are the points that produced the total.
 */
export const TrustLensInfo: React.FC<TrustLensInfoProps> = ({
  evaluation,
  align = 'left',
}) => <ScoreInfo explanation={explainTrust(evaluation)} align={align} />;
