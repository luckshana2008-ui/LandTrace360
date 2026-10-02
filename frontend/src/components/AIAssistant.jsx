import React from 'react';
import LandTraceAI from './LandTraceAI';

/**
 * Upgraded in Phase 2.6:
 * Replaces the prototype with the full LandTrace AI evidence-grounded chatbot.
 * Ensures a single, unified AI experience across LandTrace360.
 */
const AIAssistant = ({ land_id }) => {
    return <LandTraceAI initialLandId={land_id} height="680px" />;
};

export default AIAssistant;
